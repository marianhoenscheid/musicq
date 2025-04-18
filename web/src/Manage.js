import React, { useEffect, Suspense } from 'react';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';;
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { DialogTitle, DialogContentText,  DialogContent, TextField, Card, CardContent, CardActions, CardMedia, Avatar, ListItemAvatar, List, FormControlLabel, Switch, FormControl, Select, MenuItem, ListItem, IconButton, ListItemText} from '@mui/material';
import { Delete, Add, CopyAll, Share, OpenInNew } from '@mui/icons-material/';
import Cookies from 'js-cookie';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';
import useMediaQuery from '@mui/material/useMediaQuery';
import CircularProgress from '@mui/material/CircularProgress';
const AppHeader = React.lazy(() => import('./Header'));
const Copyright = React.lazy(() => import('./Footer'));

const axios = require('axios');
const QRCode = require('qrcode')

function Loader() {
  return (
    <main>
      <Grid
        container
        spacing={0}
        direction="column"
        alignItems="center"
        justify="center"
      >
        <CircularProgress />
      </Grid>
    </main>
  );
}

const lightTheme = createTheme({
palette: {
    mode: 'light',
    primary: {
    main: '#556cd6',
    },
    secondary: {
    main: '#19857b',
    },
    error: {
    main: red.A400,
    },
},
typography: {
    body2: {
    color: 'black',
    },
}, 
});

const darkTheme = createTheme({
palette: {
    mode: 'dark',
    primary: {
    main: '#556cd6',
    },
    secondary: {
    main: '#19857b',
    },
    error: {
    main: red.A400,
    },
},
typography: {
    body1: {
    color: 'white',
    },
    body2: {
    color: 'white',
    },
}, 
border: '1px solid darkgrey'
});

export default function Manage() {
  const user = Cookies.get('username')
  const secret = Cookies.get('secret')
  if (secret === undefined || user === undefined){
    window.location.replace("/");
  }
    useEffect(() => {
    settings()
  }, [data]);

  var data = null
  const [userSettingsID, setUserSettingsID] = React.useState([]);
  function settings() {
      axios.get('https://api.musicq.de/v2/settings?secret=' + secret +'&username=' + user)
      .then(function (response) {
          if(response.data.error!=undefined){
            document.cookie = "secret=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
            document.cookie = "username=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
            Cookies.remove('secret', { path: '/', domain: window.location.hostname })
            Cookies.remove('username', { path: '/', domain: window.location.hostname })
            window.location.reload();
          }
          response.data;
          setMaxPlays(response.data.maxPlays)
          setUserSettingsEnabled(response.data.enable=="true")
          setUserSettingsBlockedArtists(response.data.blocked_artists)
          setUserSettingsID(response.data.id)
          setUserSettingsPlaylists(response.data.playlists)
          QRCode.toDataURL(window.location.origin+"/s/"+response.data.id, {width: 400, errorCorrectionLevel: 'H' }, function (err, url) {
          qrcodeSetData(url)
      })
      }).catch(function (error) {
          console.log(error);
      });
  }
  function QueueShare() {
    if (navigator.share) {   
      return (
        <CardActions>
          <Button variant="contained" onClick={copyLink}>Link kopieren</Button><Button variant="contained" onClick={share}>Link teilen</Button><Button variant="contained" onClick={() => qrcodeSetOpen(true)}>QR Code anzeigen</Button>   
        </CardActions>
      );
    } else {
      return (
        <CardActions>
          <Button variant="contained" onClick={copyLink}>Link kopieren</Button><Button variant="contained" onClick={() => qrcodeSetOpen(true)}>QR Code anzeigen</Button>   
        </CardActions>
      );
    }
  }
  function PlaylistShare(props) {
    let uri = props.uri
    if (navigator.share) {   
      return (
        <Box sx={{display: "flex"}}>
          <IconButton edge="end" aria-label="share" sx={{margin: "0"}} onClick={() => sharePlaylist(uri)}>
            <Share />
          </IconButton>
          <IconButton edge="end" aria-label="open" onClick={() => window.open(window.location.origin+"/playlist/"+uri, '_blank').focus()}>
            <OpenInNew />
          </IconButton>
        </Box>
      );
    } else {
      return (
        <Box>
        <IconButton edge="end" aria-label="copy" sx={{margin: "0"}} onClick={() => copyPlaylist(uri)}>
          <CopyAll />
        </IconButton>
          <IconButton edge="end" aria-label="open" onClick={() => window.open(window.location.origin+"/playlist/"+uri, '_blank').focus()}>
          <OpenInNew />
        </IconButton>
        </Box>
      );
    }
  }
  const [qrcodeOpen, qrcodeSetOpen] = React.useState(false);
  const [addArtistOpen, addArtistSetOpen] = React.useState(false);
  const [qrcodeData, qrcodeSetData] = React.useState('');
  const [userSettingsEnabled, setUserSettingsEnabled] = React.useState(false);
  const [userSettingsBlockedArtists, setUserSettingsBlockedArtists] = React.useState([]);
  const [userSettingsPlaylists, setUserSettingsPlaylists] = React.useState([]);
  const [maxPlays, setMaxPlays] = React.useState(0);
  const [createPlaylistDialog, createPlaylistDialogSetOpen] = React.useState(false);
  const [nPlaylistName, nPlaylistNameSet] = React.useState("");
  const [nPlaylistDescription, nPlaylistDescriptionSet] = React.useState("Erstellt von musicq.de");
  
  function toggleStatus() {
    if (userSettingsEnabled){
      setUserSettingsEnabled(false);
      axios.get('https://api.musicq.de/v2/disable?secret=' + secret +'&username=' + user)
      .then(function (response) {
      }).catch(function (error) {
        console.log(error);
      });
      }
    else {
      setUserSettingsEnabled(true)
      axios.get('https://api.musicq.de/v2/enable?secret=' + secret +'&username=' + user)
      .then(function (response) {
      }).catch(function (error) {
        console.log(error);
      });
      }
  }
  function copyLink() {
    var url = window.location.origin+"/s/"+userSettingsID
    navigator.clipboard.writeText(url)
  }
  function copyPlaylist(playlistId) {
    var url = window.location.origin+"/playlist/"+playlistId
    navigator.clipboard.writeText(url)
  }
  function share() {
    var url = window.location.origin+"/s/"+userSettingsID
    if (navigator.share) {
        navigator.share({
          title: 'musicq.de',
          text: 'Jetzt Songs in die Warteschlange hinzufügen',
          url: url,
        })
    } else{
      console.log("Share is not supportet in this Browser")
    }
  }
  function sharePlaylist(playlistId) {
    var url = window.location.origin+"/playlist/"+playlistId
    if (navigator.share) {
        navigator.share({
          title: 'musicq.de',
          text: 'Jetzt Songs in die Playlist hinzufügen',
          url: url,
        })
    } else{
      console.log("Share is not supportet in this Browser")
    }
  }
function deleteArtist(id) {
  axios.delete('https://api.musicq.de/v2/blocked-artists/' + id + '?secret=' + secret +'&username=' + user)
    .then(function (response) {
      setTimeout(function () {
            settings()
    }, 100);
    }).catch(function (error) {
        console.log(error);
    });
}
async function addArtist(id) {
  axios.put('https://api.musicq.de/v2/blocked-artists/' + id +'?secret=' + secret + '&username=' + user)
    .then(function (response) {
        search("")
        document.getElementById("outlined-search").value="";
        setTimeout(function () {
              settings()
      }, 100);
    }).catch(function (error) {
        console.log(error);
    });
}

function handleChangeMaxPlays(e) {
  axios.get('https://api.musicq.de/v2/set-max-plays/' + e.target.value +'?secret=' + secret + '&username=' + user)
    .then(function (response) {
       setMaxPlays(e.target.value)
    }).catch(function (error) {
        console.log(error);
    });
}
function qrcodeHandleClose() {
  qrcodeSetOpen(false)
}

function addArtistHandleClose() {
  addArtistSetOpen(false)
  search("")
}

function createPlaylistDialogHandleClose() {
  createPlaylistDialogSetOpen(false)
}

function createPlaylist() {
  axios.get('https://api.musicq.de/v2/create_playlist/' + nPlaylistName + '/' + nPlaylistDescription +'?secret=' + secret + '&username=' + user)
    .then(function (response) {
      setTimeout(function () {
        settings()
      }, 300);
    }).catch(function (error) {
        console.log(error);
    });
  createPlaylistDialogSetOpen(false)
}

const [rows, setRows] = React.useState([]);
function search(value) {
  if(value == ""){
    value = "NULL";}
  axios.get('https://api.musicq.de/v2/search-artist/' + value +'?secret=' + secret + '&username=' + user)
  .then(function (response) {
    var data = response.data;
    if (data.error == "no valid search term"){ ;
        setRows([])
    }else{
      setRows(data.results)
    }
  })
  .catch(function (error) {
    console.log(error);
  });
}
 const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  return (
    <main>
          <ThemeProvider theme={prefersDarkMode ? darkTheme : lightTheme}>
            <CssBaseline />
            <Suspense fallback={<Loader />}><AppHeader />  </Suspense> 
      <Box
        sx={{
          bgcolor: 'background.paper',
          pt: 8,
          pb: 6,
        }}
      >
        <Container>
          <Box>
            <Box>
              <Card elevation={16} sx={{ minWidth: 275 }}>
                <CardContent>
                  <Typography variant="h5" component="div">
                    Gib anderen die Möglichkeit Lieder in deine Warteschlange hinzuzufügen
                  </Typography>
                  Die Freigabe ist <FormControlLabel control={<Switch checked={userSettingsEnabled}  onClick={toggleStatus}/>} label={userSettingsEnabled ? "aktiviert." : "deaktiviert."} />
                  <Box >
                    Wie oft darf ein Lied hinzugefügt werden?<br></br>
                    <FormControl>
                      <Select
                        id="select"
                        value={maxPlays}
                        onChange={(e) => handleChangeMaxPlays(e)}
                      >
                        <MenuItem value={0}>beliebig oft</MenuItem>
                        <MenuItem value={1}>ein mal</MenuItem>
                        <MenuItem value={2}>zwei mal</MenuItem>
                        <MenuItem value={3}>drei mal</MenuItem>
                        <MenuItem value={4}>vier mal</MenuItem>
                        <MenuItem value={5}>fünf mal</MenuItem>
                        <MenuItem value={10}>zehn mal</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </CardContent>
                <QueueShare></QueueShare>
              </Card>
              <br></br>
              <Card elevation={16} sx={{ minWidth: 275 }}>
                <CardContent>
                  <Typography variant="h5" component="div">
                    Blockierte Künstler:innen
                  </Typography>
                  <Grid item>       
                    <List >
                      {userSettingsBlockedArtists.map(e => {return(
                        <ListItem key={e.id} secondaryAction={
                          <IconButton edge="end" aria-label="delete" onClick={ () => deleteArtist(e.id)}>
                            <Delete />
                          </IconButton>
                        }>
                          <ListItemAvatar>
                            <Avatar variant="square" alt="artist picture" src={e.picture}/>
                          </ListItemAvatar>
                          <ListItemText primary={e.name}/>
                        </ListItem>
                      )})}
                    </List>
                    <Box textAlign='center'>
                      
                    </Box>
                  </Grid>
                </CardContent>
                <CardActions>
                  <Button variant="contained" startIcon={<Add />} onClick={() => addArtistSetOpen(true)}>
                    hinzufügen
                  </Button>  
                </CardActions>
              </Card>
              <br></br>
              <Card elevation={16} sx={{ minWidth: 275 }}>
                <CardContent>
                  <Typography variant="h5" component="div">
                    Playlists
                  </Typography>
                  <Grid item>       
                    <List >
                      {userSettingsPlaylists.map(e => {
                          return(
                          <ListItem key={e.uri} secondaryAction={
                            <PlaylistShare uri={e.uri}></PlaylistShare>
                          } >
                            <ListItemAvatar>
                              <Avatar variant="square" alt="playlist cover" src={e.cover}/>
                            </ListItemAvatar>
                            <ListItemText primary={e.name} secondary={e.description}/>
                          
                          </ListItem>
                        )
                      })}
                    </List>
                    <Box textAlign='center'>
                      
                    </Box>
                  </Grid>
                </CardContent>
                <CardActions>
                  <Button variant="contained" startIcon={<Add />} onClick={() => createPlaylistDialogSetOpen(true)}>
                    erstellen
                  </Button>  
                </CardActions>
              </Card>
            </Box>
            <Dialog
              fullScreen={false}
              open={qrcodeOpen}
              onClose={qrcodeHandleClose}
              aria-labelledby="responsive-dialog-title"
            >
              <CardMedia
                component="img"
                height="auto"
                image={qrcodeData}
                alt="qr-code"
              /> 
              <DialogActions>
                <Button onClick={qrcodeHandleClose} autoFocus>
                  Schließen
                </Button>
              </DialogActions>
            </Dialog>
            
            <Dialog
              fullScreen={false}
              open={addArtistOpen}
              onClose={addArtistHandleClose}
              aria-labelledby="responsive-dialog-title"
              fullWidth={true}
            >
              <DialogTitle>Blockiere Künstler:innen</DialogTitle>
              <DialogContentText>
              </DialogContentText>
              <DialogContent>
                <TextField fullWidth
                    id="outlined-search" 
                    label="Suche" 
                    type="search"
                    onChange={(e) => search(e.target.value)}
                />
                <Grid item>       
                  <List >
                    {rows.map(e => {return(
                      <ListItem key={e.id} onClick={() => addArtist(e.id)} secondaryAction={
                        <IconButton edge="end" aria-label="add">
                          <Add />
                        </IconButton>
                      }>
                        <ListItemAvatar>
                          <Avatar variant="square" alt="arist picture" src={e.picture}/>
                        </ListItemAvatar>
                       <ListItemText primary={e.name}/>
                      </ListItem>
                    )})}
                  </List>
                </Grid>

              </DialogContent>
              <DialogActions>
                <Button onClick={addArtistHandleClose} autoFocus>
                  Schließen
                </Button>
              </DialogActions>
            </Dialog>

            
            <Dialog
              fullScreen={false}
              open={createPlaylistDialog}
              onClose={createPlaylistDialogHandleClose}
              aria-labelledby="responsive-dialog-title"
              fullWidth={true}
            >
              <DialogTitle>Erstelle eine Playlist</DialogTitle>
              <DialogContentText>
              </DialogContentText>
              <DialogContent>
                <TextField fullWidth
                    id="playlist-name" 
                    label="Name" 
                    type="text"
                    onChange={(e) => nPlaylistNameSet(e.target.value)}
                    value={nPlaylistName}
                />
                <br></br>
                <br></br>
                <TextField fullWidth
                    id="playlist-description" 
                    label="Bechreibung" 
                    type="text"
                    value={nPlaylistDescription}
                    onChange={(e) => nPlaylistDescriptionSet(e.target.value)}
                />
              </DialogContent>
              <DialogActions>
              <Button onClick={createPlaylistDialogHandleClose} autoFocus>
                  Schließen
                </Button>
              <Button onClick={createPlaylist} autoFocus>
                  Erstellen
                </Button>
        
              </DialogActions>
            </Dialog>
          </Box>
        </Container>
      </Box>
      <Box sx={{ bgcolor: 'background.paper', p: 6 }} component="footer">
            <Suspense fallback={<Loader />}><Copyright /></Suspense>
            </Box>
        </ThemeProvider>
    </main>
  );
}
