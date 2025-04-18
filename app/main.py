import json
import logging
import os
import secrets
import string
from datetime import timedelta
from xmlrpc.client import Boolean
import flask
import spotipy
from flask import request, jsonify, redirect, abort
from redis import Redis
from spotipy import CacheFileHandler
from spotipy.oauth2 import SpotifyOAuth
import requests
from urllib.parse import urlparse


app = flask.Flask(__name__)
app.config["DEBUG"] = False
baseurl = os.getenv('BASE_URL')
api_id = os.getenv('SP_APP_ID')
api_secret = os.getenv('SP_APP_SECRET')
redis_host = os.getenv('REDIS_HOST')
redis_port = os.getenv('REDIS_PORT')
CSE_API_KEY = os.getenv('CSE_API_KEY')
SEARCH_ENGINE_ID = os.getenv('CSE_SEARCH_ENGINE_ID')
API_VERSION = "v2"
r = Redis(host=redis_host, port=redis_port, db=1)

scope = "user-read-playback-state,user-modify-playback-state,user-read-currently-playing,user-library-read," \
        "playlist-read-private,playlist-modify-private,playlist-modify-public"

def db_get(key):
    result = r.get(str(key))
    if result == None:
        return None
    return json.loads(result)


def db_set(key, value):
    if key is not Boolean:
        success = r.set(str(key), json.dumps(value))
        return success

def db_cache(key, value=None):
    if value is None:
        cache = db_get(key)
        if cache is None:
            return None
        else:
            return cache
    else:
        success = db_set(key, value)
        r.expire(str(key), timedelta(days=1))
        return success


def convertMillis(millis):
    seconds = (millis / 1000) % 60
    minutes = (millis / (1000 * 60)) % 60
    return '{:02.0f}:{:02.0f}'.format(minutes, seconds)

@app.route(f'/{API_VERSION}/add_playlist/<playlist_uri>', methods=['GET'])
def test(playlist_uri):
    uid, user, username, secret, sp, allow_admin, playlist = getUser(request)
    if sp is not None:
        db_set(playlist_uri,
               {"id": uid, "username": user['username']})
        user['playlists'].append(playlist_uri)
        db_set(uid, user)
    return '''done'''

@app.route(f'/{API_VERSION}/', methods=['GET'])
def home():
    return f'<h1>api.musicq.de</h1><p>API for musicq.de. ({API_VERISON})</p>'

@app.route(f'/{API_VERSION}/auth', methods=['GET'])
def auth():
    oauth = SpotifyOAuth(client_id=api_id,
                         client_secret=api_secret,
                         redirect_uri=baseurl,
                         open_browser=False,
                         scope=scope,
                         show_dialog=False)
    if request.values.get("code", None) is None:
        auth_url = oauth.get_authorize_url()
        response = {'auth_url': auth_url}
        return jsonify(response)
    else:
        code = oauth.parse_response_code(request.url)
        oauth.get_access_token(code=code, as_dict=False, check_cache=False)
        access_token = oauth.get_cached_token()
        username = spotipy.Spotify(client_credentials_manager=oauth).me()['id']
        reg_id = db_get(username)
        with open('.cache-' + username, 'w') as outfile:
            json.dump(access_token, outfile)
        os.remove(".cache")
        if reg_id is None:
            uid = ''.join(secrets.choice(string.ascii_letters + string.digits) for x in range(5))
            secret = ''.join(secrets.choice(string.ascii_letters + string.digits) for x in range(12))
            db_set(uid,
                   {"username": username, "enable": "true", "maxPlays": "0", "blocked_artists": [],
                    "already_played": [], "playlists": []})
            db_set(username, {"secret": secret, "id": uid})
        else:
            secret = reg_id['secret']
        response = {'secret': secret,
                    'username': username}
        return jsonify(response)

@app.route(f'/{API_VERSION}/np', methods=['GET'])
def currentlyPlaying():
    uid, user, username, secret, sp, allow_admin, playlist = getUser(request)
    if sp is not None:
        np = sp.currently_playing()
        enabled = user['enable']
        if np is not None and enabled == "true":
            item = np['item']
            result = {"results": [{"song": item['name'],
                                   "artist": item['artists'][0]['name'],
                                   "album": item['album']['name'],
                                   "duration": convertMillis(item['duration_ms']),
                                   "cover": item['album']['images'][2]['url'],
                                   "uri": item['uri']}]}
        else:
            if enabled == "true":
                result = {"results": [{"song": "Keine Wiedergabe",
                                       "artist": "-",
                                       "album": "-",
                                       "duration": "0:00",
                                       "cover": "",
                                       "uri": ""}]}
            else:
                result = {"results": [{"song": "Keine Freigabe",
                                       "artist": "-",
                                       "album": "-",
                                       "duration": "0:00",
                                       "cover": "",
                                       "uri": ""}]}
        return jsonify(result)
    else:
        return jsonify({"results": [{"song": "Unknown",
                                       "artist": "-",
                                       "album": "-",
                                       "duration": "0:00",
                                       "cover": "",
                                       "uri": ""}]})

@app.route(f'/{API_VERSION}/playlist', methods=['GET'])
def getPlaylist():
    uid, user, username, secret, sp, allow_admin, playlist = getUser(request)
    if sp is not None:
        sp_playlist = sp.playlist(playlist)
        if len(sp_playlist['images']) > 0:
            cover = sp_playlist['images'][0]['url']
        else:
            cover = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
        sp_playlist_tracks = sp.playlist_items(playlist,limit=100)
        results = {"results": [], "name": sp_playlist['name'], "cover": cover, "description": sp_playlist['description'], "owner": sp_playlist['owner']['display_name']}
        songs = sp_playlist_tracks['items']
        while sp_playlist_tracks['next']:
            sp_playlist_tracks = sp.next(sp_playlist_tracks)
            songs.extend(sp_playlist_tracks['items'])

        for item in songs[::-1]:
            results["results"].append({"song": item['track']['name'],
                                       "artist": item['track']['artists'][0]['name'],
                                       "album": item['track']['album']['name'],
                                       "duration": convertMillis(item['track']['duration_ms']),
                                       "cover": item['track']['album']['images'][0]['url'],
                                       "uri": item['track']['uri']})

        return jsonify(results)
    else:
        return jsonify({"error": "no valid playlist"})

@app.route(f'/{API_VERSION}/add_to_playlist/<uri>', methods=['PUT'])
def addToPlaylist(uri):
    uris = []
    uris.append(uri)
    uid, user, username, secret, sp, allow_admin, playlist = getUser(request)
    if sp is not None:
        artist_result = sp.track(uri)['artists'][0]
        artist = artist_result['id']
        artist_name = artist_result['name']
        if artist not in [artists['id'] for artists in user['blocked_artists']]:
            sp.playlist_add_items(playlist_id=playlist,
                                  items=uris)
            return jsonify({"alert": "success", "msg": "Song wurde zur Playlist hinzugefügt"})
        else:
            return jsonify(
                {"alert": "error", "msg": "Du kannst leider keine Songs von " + artist_name + " hinzufügen"})
    else:
        return jsonify({"error": "no valid playlist"})

@app.route(f'/{API_VERSION}/playlists', methods=['GET'])
def getPlaylists():
    uid, user, username, secret, sp, allow_admin, playlist = getUser(request)
    if sp is not None:
        sp_playlists = sp.current_user_playlists(limit=50)
        results = {"results": []}
        for item in sp_playlists['items']:
            results["results"].append({"name": item['name'],
                                       "uri": item['uri']})
        return jsonify(results)
    else:
        return jsonify({"error": "no valid playlist"})

@app.route(f'/{API_VERSION}/create_playlist/<name>/<description>', methods=['GET'])
def createPlaylist(name, description):
    uid, user, username, secret, sp, allow_admin, playlist = getUser(request)
    if sp is not None and allow_admin is True:
        sp_playlists = sp.user_playlist_create(user=user['username'],
                                               name=name,
                                               public=False,
                                               collaborative=False,
                                               description=description)
        db_set(sp_playlists['id'],
               {"id": uid, "username": user['username']})
        user['playlists'].append(sp_playlists['id'])
        db_set(uid, user)
        return jsonify(sp_playlists)
    else:
        return jsonify({"error": "no valid id"})


@app.route(f'/{API_VERSION}/lyrics', methods=['GET'])
def getLyrics():
    uid, user, username, secret, sp, allow_admin, playlist = getUser(request)
    if user['enable'] == "true":
        darkmode = request.values.get('dark', None)
        if darkmode == "true":
            url_suffix = "/embed?theme=dark"
        else:
            url_suffix = "/embed?theme=light"
        if sp is not None:
            np = sp.currently_playing()
            if np is not None:
                item = np['item']
                cache_key = "lyrics_" + item['uri']
                cache = db_cache(cache_key)
                if cache is None:
                    artists = ""
                    for artist in item['artists']:
                        artists += artist['name'] + " "
                    query = item['name'] + " " + artists + "lyrics"
                    url = f"https://www.googleapis.com/customsearch/v1/siterestrict?key={CSE_API_KEY}&cx={SEARCH_ENGINE_ID}&q={query}"
                    lyric_cse_data = requests.get(url).json()
                    for search_item in lyric_cse_data.get("items"):
                        link = search_item.get("link")
                        if "/translation/" not in link and "/amp/" not in link and "/artist/" not in link:
                            embed_url = link
                            db_cache(cache_key, embed_url)
                            break
                        else:
                            embed_url = ""
                else:
                    embed_url = cache
                if embed_url != "":
                    return jsonify({"lyrics": embed_url + url_suffix})
                else:
                    abort(404)
            else:
                return jsonify({"error": "no valid id"})
        else:
            return jsonify({"error": "no valid id"})
    else: 
        return jsonify({"error": "disabled"})

@app.route(f'/{API_VERSION}/settings', methods=['GET'])
def settings():
    uid, user, username, secret, sp, allow_admin, playlist = getUser(request)
    if sp is not None:
        if request.method == 'GET':
            if allow_admin:
                user_copy = user.copy()
                user_copy['id'] = uid
                user_copy['playlists'] = []
                for playlist in user['playlists']:
                    try:
                        sp_playlist = sp.playlist(playlist)
                        if len(sp_playlist['images']) > 0:
                            cover = sp_playlist['images'][0]['url']
                        else:
                            cover = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
                        results = {"uri": playlist, "name": sp_playlist['name'], "cover": cover,
                                   "description": sp_playlist['description'],
                                   "owner": sp_playlist['owner']['display_name']}
                        user_copy['playlists'].append(results)
                    except:
                        print("*")
                        #user['playlists'].remove(playlist)
                        #db_set(uid, user)
                return jsonify(user_copy)
            else:
                return jsonify({"error": "wrong secret or username"})
    else:
        return jsonify({"error": "no valid id"})


@app.route(f'/{API_VERSION}/blocked-artists/<artist>', methods=['DELETE', 'PUT'])
def blockedArtists(artist):
    uid, user, username, secret, sp, allow_admin, playlist = getUser(request)
    if request.method == 'PUT' and artist != "undefined":
        if allow_admin:
            user['blocked_artists'] = list(filter(lambda i: i['id'] != artist, user['blocked_artists']))
            sp_data = sp.artist(artist)
            artist_data = {"name": sp_data['name'],
                           "picture": sp_data['images'][2]['url'],
                           "id": sp_data['id']}
            user['blocked_artists'].append(artist_data)
            db_set(uid, user)
            return jsonify("ok")
    elif request.method == 'DELETE':
        if allow_admin:
            user['blocked_artists'] = list(filter(lambda i: i['id'] != artist, user['blocked_artists']))
            db_set(uid, user)
        return jsonify("ok")
    else:
        return jsonify({"error": "no valid secret or id"})


@app.route(f'/{API_VERSION}/set-max-plays/<maxplays>', methods=['GET'])
def maxplays(maxplays):
    uid, user, username, secret, sp, allow_admin, playlist = getUser(request)
    if maxplays != "undefinded":
        if allow_admin:
            user['maxPlays'] = maxplays
            if maxplays == "0":
                user['already_played'] = []
            db_set(uid, user)
            return jsonify("ok")
    else:
        return jsonify({"error": "no valid secret or id"})


@app.route(f'/{API_VERSION}/search-artist/<q>', methods=['GET'])
def search_artist(q):
    uid, user, username, secret, sp, allow_admin, playlist = getUser(request)
    if sp is not None:
        if q != "NULL" and q is not None:
            cache_key = "arist_search_" + q
            cache = db_cache(cache_key)
            if cache is None:
                print(f'search for artist {q}: no cache')
                result = sp.search(q, limit=10, type="artist", market="DE")
                results = {"results": []}
                for item in result['artists']['items']:
                    if len(item['images']) > 0:
                        results["results"].append({"name": item['name'],
                                                   "picture": item['images'][2]['url'],
                                                   "id": item['id']})
                db_cache(cache_key, results)
            else:
                print(f'search for artist {q}: cache')
                results = cache
            return jsonify(results)
        else:
            return jsonify({"error": "no valid search term"})
    else:
        return jsonify({"error": "no valid id"})


@app.route(f'/{API_VERSION}/status', methods=['GET'])
def status():
    uid, user, username, secret, sp, allow_admin, playlist = getUser(request)
    if user is not False and user is not None:
        enabled = user['enable']
        if enabled == "true":
            np = sp.currently_playing()
            if np is not None:
                return jsonify({"status": "enabled"})
            else:
                return jsonify({"status": "diabled"})
        else:
            return jsonify({"status": "diabled"})
    else:
        return jsonify({"error": "no valid id"})


@app.route(f'/{API_VERSION}/disable', methods=['GET'])
def disable():
    uid, user, username, secret, sp, allow_admin, playlist = getUser(request)
    if allow_admin:
        user['enable'] = "false"
        db_set(uid, user)
        return jsonify("ok")
    else:
        return jsonify({"error": "no valid secret"})


@app.route(f'/{API_VERSION}/enable', methods=['GET'])
def enable():
    uid, user, username, secret, sp, allow_admin, playlist = getUser(request)
    if allow_admin:
        user['enable'] = "true"
        db_set(uid, user)
        return jsonify("ok")
    else:
        return jsonify({"error": "no valid secret"})


@app.route(f'/{API_VERSION}/newurl', methods=['GET'])
def newurl():
    uid, user, username, secret, sp, allow_admin, playlist = getUser(request)
    if allow_admin:
        new_uid = ''.join(secrets.choice(string.ascii_letters + string.digits) for x in range(5))
        r.rename(uid, new_uid)
        secret_data = db_get(username)
        secret_data['id'] = new_uid
        db_set(username, secret_data)
        return jsonify("ok")
    else:
        return jsonify({"error": "no valid secret"})


@app.route(f'/{API_VERSION}/delete', methods=['DELETE'])
def delete():
    uid, user, username, secret, sp, allow_admin, playlist = getUser(request)
    if allow_admin:
        r.delete(uid)
        r.delete(username)
        os.remove(".cache-" + username)
        return jsonify("ok")
    else:
        return jsonify({"error": "no valid secret"})


@app.route(f'/{API_VERSION}/search/<q>', methods=['GET'])
def search(q):
    uid, user, username, secret, sp, allow_admin, playlist = getUser(request)
    if sp is not None:
        if q != "NULL" and q is not None:
            cache_key = "track_search_" + q
            cache = db_cache(cache_key)
            if cache is None:
                print(f'search for track {q}: no cache')
                result = sp.search(q, limit=50, type="track", market="DE")
                results = {"results": []}
                for item in result['tracks']['items']:
                    results["results"].append({"song": item['name'],
                                               "artist": item['artists'][0]['name'],
                                               "album": item['album']['name'],
                                               "duration": convertMillis(item['duration_ms']),
                                               "cover": item['album']['images'][2]['url'],
                                               "cover_full": item['album']['images'][0]['url'],
                                               "uri": item['uri']})
                db_cache(cache_key, results)
            else:
                print(f'search for track {q}: cache')
                results = cache
            return jsonify(results)
        else:
            return jsonify({"error": "no valid search term"})
    else:
        return jsonify({"error": "no valid id"})


@app.route(f'/{API_VERSION}/queue/<uri>', methods=['PUT'])
def addToQueue(uri):
    uid, user, username, secret, sp, allow_admin, playlist = getUser(request)
    if sp is not None and user is not False and user is not None:
        artist_result = sp.track(uri)['artists'][0]
        artist = artist_result['id']
        artist_name = artist_result['name']
        if (user['already_played'].count(uri) < int(user['maxPlays'])) or (int(user['maxPlays']) == 0):
            if artist not in [artists['id'] for artists in user['blocked_artists']]:
                sp.add_to_queue(uri)
                user['already_played'].append(uri)
                db_set(uid, user)
                return jsonify({"alert": "success", "msg": "Song wurde zu Warteschlange hinzugefügt"})
            else:
                return jsonify(
                    {"alert": "error", "msg": "Du kannst leider keine Songs von " + artist_name + " hinzufügen"})
        else:
            return jsonify({"alert": "error", "msg": "Dieser Song wurde schon zu oft abgespielt"})
    else:
        return jsonify({"error": "no valid id"})


def getUser(request):
    uid = request.values.get('id', None)
    username = request.values.get('username', None)
    secret = request.values.get('secret', None)
    playlist = request.values.get('playlist', None)
    allow_admin = False
    if playlist is not None and playlist != "null":
        playlist_from_db = db_get(playlist)
        if playlist_from_db is not None:
            uid = playlist_from_db['id']
    if username is not None and username != "null":
        manage_from_db = db_get(username)
        if manage_from_db is not None:
            secret_from_db = manage_from_db['secret']
            if secret_from_db == secret:
                allow_admin = True
                uid = manage_from_db['id']

    if uid is not None and uid != "null":
        user_from_db = db_get(uid)
        if user_from_db is not None:
            user = user_from_db
            oauth = SpotifyOAuth(client_id=api_id,
                                 client_secret=api_secret,
                                 redirect_uri=baseurl,
                                 open_browser=False,
                                 scope=scope,
                                 cache_handler=CacheFileHandler(username=user['username']))
            sp = spotipy.Spotify(client_credentials_manager=oauth)
        else:
            user = None
            sp = None
    else:
        uid = None
        username = None
        secret = None
        user = None
        sp = None
        allow_admin = False
    return uid, user, username, secret, sp, allow_admin, playlist