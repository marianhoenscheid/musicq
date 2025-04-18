import React, { useEffect, Suspense } from 'react';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import { DataGrid, deDE } from "@mui/x-data-grid";
import { Avatar, Snackbar, TextField, CardMedia, Card, CardContent } from '@mui/material';
import MuiAlert from '@mui/material/Alert'
import useMediaQuery from '@mui/material/useMediaQuery';
import { useParams } from "react-router-dom";
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';
import CircularProgress from '@mui/material/CircularProgress';
const AppHeader = React.lazy(() => import('./Header'));
const Copyright = React.lazy(() => import('./Footer'));
const axios = require('axios');
const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

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

export default function Playlist() {
  const { playlist } = useParams();
  const [realTime, setRealTime] = React.useState(true);
  const [firstTime, setFirstTime] = React.useState(true);
  useEffect(() => {
    if (realTime && firstTime) {
      search("")
    }
    let interval;
    if (realTime) {
      interval = setInterval(() => {
        search("")
      }, 2500);
    } else {
       clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [realTime]);
  const columns = [
    { field: "cover", headerName: "", width: 40, renderCell: (params) => <Avatar variant="square" alt="song cover" src={rows[params.row.id].cover}></Avatar> },      
    { field: "song", headerName: "", flex: 1000, renderCell: (params) => <Box ><Typography variant="body1" mt={0}>{rows[params.row.id].song} </Typography><Typography  variant="body2" mt={0}>{rows[params.row.id].artist} &#8226; {rows[params.row.id].album} &#8226; {rows[params.row.id].duration}</Typography></Box>},
    { field: "artist", headerName: "", width: 0, hide: true },
    { field: "album", headerName: "", width: 0, hide: true }, 
    { field: "duration", headerName: "", width: 0, hide: true },
    { field: "uri", headerName: "", width: 0, hide: true },
    { field: "cover_full", headerName: "", width: 0, hide: true},
    { field: "add_able", headerName: "", width: 0, hide: true}
  ];
  const [rows, setRows] = React.useState([]);
  const [selectedSong, setSelectedSong] = React.useState({});
  const [alert, setAlert] = React.useState("success");
  const [msg, setMsg] = React.useState("");
  const [playlistName, setPlaylistName] = React.useState(""); 
  const [playlistCover, setPlaylistCover] = React.useState(""); 
  const [playlistDescription, setPlaylistDescription] = React.useState(""); 
  const [playlistOwner, setPlaylistOwner] = React.useState(""); 
  function search(value) {
    setFirstTime(false)
    if(value == ""){
      setRealTime(true)
      axios.get('https://api.musicq.de/v2/playlist?playlist=' + playlist)
        .then(function (response) {
          var data = response.data;
          var newRows = [];
          data.results.forEach((result, index) => {
            newRows.push({
              id: index,
              cover: result.cover,
              song: result.song,
              artist: result.artist,
              album: result.album,
              duration: result.duration,
              uri: result.uri,
              cover_full: result.color_full,
              add_able: false
            })
            if (result.song == "Keine Wiedergabe" && result.artist == "-") {
              location.reload()
            }
          })
          setPlaylistName(data.name);
          setPlaylistCover(data.cover);
          setPlaylistDescription(data.description)
          setPlaylistOwner(data.owner)
          setRows(newRows)
        }).catch(function (error) {
          //error
        });
    }else{
    setRealTime(false)
    axios.get('https://api.musicq.de/v2/search/' + value +'?playlist=' + playlist)
    .then(function (response) {
      var data = response.data;
      var newRows = [];
      if (data.error == "no valid search term" || data.error == "no valid id"){ ;
        
      }else{
        data.results.forEach((result, index) => {
          newRows.push({
            id: index,
            cover: result.cover,
            song: result.song,
            artist: result.artist,
            album: result.album,
            duration: result.duration,
            uri: result.uri,
            cover_full: result.cover_full,
            add_able: true
          })
        })
        setRows(newRows)
      }
    })
    .catch(function (error) {
      //error
    });
  }
}
  function askUser(nSong, nArtist, nUri, nCoverFull, nAdd_able) {
    if(nAdd_able == true){
      var nextSong = {
        song: nSong,
        artist: nArtist,
        uri: nUri,
        cover_full: nCoverFull
      }
        setSelectedSong(nextSong);
        dialogeSetOpen(true);
    }
  }
  function addToPlaylist(value) {
    axios.defaults.headers.post['Access-Control-Allow-Origin'] = '*';
    axios.put('https://api.musicq.de/v2/add_to_playlist/' + value + '?playlist=' + playlist)
    .then(function (response) {
      setAlert(response.data.alert);
      setMsg(response.data.msg);
      snackSetOpen(true);
      document.getElementById("outlined-search").value="";
      search("")
    })
    .catch(function (error) {
      console.log(error);
    });
  }
  const [snackOpen, snackSetOpen] = React.useState(false);
  const [dialogeOpen, dialogeSetOpen] = React.useState(false);
  
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const snackHandleClose = () => {
    snackSetOpen(false);
  };

  const dialogeHandleCloseYes = () => {
    addToPlaylist(selectedSong.uri)
    dialogeSetOpen(false);
  };
  const dialogeHandleCloseNo = () => {
    dialogeSetOpen(false);
  };

  
  return (
    <main>
      <ThemeProvider theme={prefersDarkMode ? darkTheme : lightTheme}>
            <CssBaseline />
            <Suspense fallback={<Loader />}><AppHeader />  </Suspense> 
      <Grid
        container
        spacing={0}
        direction="column"
        alignItems="center"
        justify="center"
      >
      <Box
        sx={{
          bgcolor: 'background.paper',
          pt: 8,
          pb: 6,
        }}
      >
        <Container>

        <Card elevation={16} sx={{display: 'flex', minWidth: 300, maxWidth: 800, maxHeight: 150}}>
        <CardMedia
            component="img"
            sx={{ width: 150 , height: 150 }}
            
            image={playlistCover}
            alt="Playlist Cover"
          />
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <CardContent>
              <Typography component="div" variant="h5">
                {playlistName}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary" component="div">
                {playlistDescription}
              </Typography>
            </CardContent>
          </Box>
       
        </Card>

        </Container>
      </Box>

      <Container>
        <TextField fullWidth
          id="outlined-search" 
          label="Zum hinzufügen suchen" 
          type="search"
          onChange={(e) => search(e.target.value)}
        />
      </Container> 

      <Box sx={{minHeight: 10}}>

      </Box>


      </Grid>
      <Container>
        <Box >
          <Grid>
            <DataGrid
                disableColumnMenu={true}
                disableSelectionOnClick={true}
                localeText={deDE.components.MuiDataGrid.defaultProps.localeText}
                onRowClick={(params) => askUser(rows[params.row.id].song,rows[params.row.id].artist,rows[params.row.id].uri,rows[params.row.id].cover_full,rows[params.row.id].add_able)}
                autoHeight={true}
                headerHeight={0}
                hideFooterSelectedRowCount={true}
                hideFooter={false}
                rows={rows}
                columns={columns}
            />
          </Grid>
        </Box>
        <Typography variant="subtitle2" color="text.secondary" component="div" sx={{textAlign: "center"}}>
                  Erstellt von {playlistOwner}
          </Typography>
      </Container>
      <Dialog
        fullScreen={false}
        open={dialogeOpen}
        onClose={dialogeHandleCloseNo}
        aria-labelledby="responsive-dialog-title"
      >
        <CardMedia
          component="img"
          height="auto"
          image={selectedSong.cover_full}
          alt="album cover"
        /> 
          <DialogTitle id="responsive-dialog-title">
            {"Song hinzufügen?"}
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              Möchtest du {selectedSong.song} von {selectedSong.artist} zur Playlist hinzufügen?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button autoFocus onClick={dialogeHandleCloseNo}>
              Nein
            </Button>
            <Button onClick={dialogeHandleCloseYes} autoFocus>
              Ja
            </Button>
          </DialogActions>
      </Dialog>
      <Snackbar open={snackOpen} autoHideDuration={6000} onClose={snackHandleClose}>
        <Alert onClose={snackHandleClose} severity={alert} sx={{ width: '100%' }}>
          {msg}
        </Alert>
      </Snackbar>
      <Box sx={{ bgcolor: 'background.paper', p: 6 }} component="footer">
            <Suspense fallback={<Loader />}><Copyright /></Suspense>
            </Box>
        </ThemeProvider>
      </main>
  );
}
