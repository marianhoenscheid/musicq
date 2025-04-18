
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
import { AppBar, Toolbar, IconButton, Avatar, Snackbar, TextField, CardMedia } from '@mui/material';
import MuiAlert from '@mui/material/Alert'
import CloseIcon from '@mui/icons-material/Close';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useParams } from "react-router-dom";
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';
import CircularProgress from '@mui/material/CircularProgress';
const NotFound = React.lazy(() => import('./NotFound'));
const AppHeader = React.lazy(() => import('./Header'));
const Copyright = React.lazy(() => import('./Footer'));
const Disabeled = React.lazy(() => import('./Disabeled'));
const NoPlayback = React.lazy(() => import('./NoPlayback'));

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

export default function Queue() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [realTime, setRealTime] = React.useState(true);
  const [firstTime, setFirstTime] = React.useState(true);
  const { id } = useParams();
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
    { field: "cover_full", headerName: "", width: 0, hide: true}
  ];
  const [rows, setRows] = React.useState([]);
  const [selectedSong, setSelectedSong] = React.useState({});
  const [alert, setAlert] = React.useState("success");
  const [msg, setMsg] = React.useState("");
  const [enabled, setEnabled] = React.useState(true);
  const [playback, setPlayback] = React.useState(true);
  const [unknown, setUnknown] = React.useState(false);
  function search(value) {
    setFirstTime(false)
    if(value == ""){
      setRealTime(true)
      axios.get('https://api.musicq.de/v2/np?id=' + id)
        .then(function (response) {
          var data = response.data;
          var newRows = [];
          data.results.forEach((result, index) => {
            newRows.push({
              id: index,
              cover: result.cover,
              song: "Now Playing: " + result.song,
              artist: result.artist,
              album: result.album,
              duration: result.duration,
              uri: result.uri,
              cover_full: result.color_full
            })
            if (result.song == "Keine Freigabe" && result.artist == "-") {
              setPlayback(false)
              setEnabled(false)
            } else if (result.song == "Keine Wiedergabe" && result.artist == "-") {
              setEnabled(true)
              setPlayback(false)
            } else if (result.song == "Unknown" && result.artist == "-") {
              setUnknown(true)
            } else {
              setPlayback(true)
              setEnabled(true)
            }
          })
          setRows(newRows)
        }).catch(function (error) {
          //error
        });
    }else{
    setRealTime(false)
    axios.get('https://api.musicq.de/v2/search/' + value +'?id=' + id)
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
            cover_full: result.cover_full
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
  function askUser(nSong, nArtist, nUri, nCoverFull) {
    if(!nSong.startsWith("Now Playing:")){
      var nextSong = {
        song: nSong,
        artist: nArtist,
        uri: nUri,
        cover_full: nCoverFull
      }
        setSelectedSong(nextSong);
        dialogeSetOpen(true);
    } else{
      setAlert("info");
      setMsg("Suche Lyrics...");
      snackSetOpen(true);
      axios.get('https://api.musicq.de/v2/lyrics?id=' + id + '&dark=' + prefersDarkMode)
        .then(function (response) {
          setLyrics(response.data.lyrics)
          lyricsSetOpen(true)
          snackSetOpen(false);
        }).catch(function (error) {
          setAlert("error");
          setMsg("Wir konnten zu diesem Song leider keine Lyrics finden");
          snackSetOpen(true);
        });
    }
  }
  function addToQueue(value) {
    axios.defaults.headers.post['Access-Control-Allow-Origin'] = '*';
    axios.put('https://api.musicq.de/v2/queue/' + value + '?id=' + id)
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
  const [lyricsOpen, lyricsSetOpen] = React.useState(false);
  const [lyrics, setLyrics] = React.useState("")
  
  const snackHandleClose = () => {
    snackSetOpen(false);
  };

  const dialogeHandleCloseYes = () => {
    addToQueue(selectedSong.uri)
    dialogeSetOpen(false);
  };
  const dialogeHandleCloseNo = () => {
    dialogeSetOpen(false);
  };
  const lyricsHandleClose = () => {
    lyricsSetOpen(false);
    search("")
    setLyrics("")
  };

  if (enabled && playback && !unknown){
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
            <TextField fullWidth
              id="outlined-search" 
              label="Suche" 
              type="search"
              onChange={(e) => search(e.target.value)}
            />
        </Container>
      </Box>
      <Container>
        <Box >
          <Grid>
            <DataGrid
                disableColumnMenu={true}
                disableSelectionOnClick={true}
                pageSize={50}
                localeText={deDE.components.MuiDataGrid.defaultProps.localeText}
                onRowClick={(params) => askUser(rows[params.row.id].song,rows[params.row.id].artist,rows[params.row.id].uri,rows[params.row.id].cover_full)}
                autoHeight={true}
                headerHeight={0}
                hideFooter={true}
                rows={rows}
                columns={columns}
            />
          </Grid>
        </Box>
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
              Möchtest du {selectedSong.song} von {selectedSong.artist} zur Warteschlage hinzufügen?
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
      <Dialog
        fullScreen={true}
        open={lyricsOpen}
        onClose={lyricsHandleClose}
      >
        <AppBar sx={{ position: 'relative' }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={lyricsHandleClose}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
            <Typography sx={{ ml: 2, flex: 1 }} variant="h6">
              Lyrics
            </Typography>
          </Toolbar>
        </AppBar>
          <DialogContent style={{border: 'none', height: '100%', width: '100%',  margin: '0', padding: '0'}}>
            <DialogContentText style={{border: 'none', height: '100%', width: '100%',  margin: '0', padding: '0'}}>
                <iframe src={lyrics} style={{border: 'none', height: '100%', width: '100%',  margin: '0', padding: '0', left: '0', top: '0'}} ></iframe>
            </DialogContentText>
          </DialogContent>
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
  );} else if (!playback && enabled){
    return (
      <ThemeProvider theme={prefersDarkMode ? darkTheme : lightTheme}>
            <CssBaseline />
            <Suspense fallback={<Loader />}><AppHeader />  </Suspense> 
            <Suspense fallback={<Loader />}>
                    <NoPlayback />
                </Suspense>
      
            <Box sx={{ bgcolor: 'background.paper', p: 6 }} component="footer">
            <Suspense fallback={<Loader />}><Copyright /></Suspense>
            </Box>
        </ThemeProvider>
    );
  } else if (unknown){
    return (
      <ThemeProvider theme={prefersDarkMode ? darkTheme : lightTheme}>
            <CssBaseline />
            <Suspense fallback={<Loader />}>
              <NotFound />
            </Suspense>
        </ThemeProvider>
    );
  }else {
    return (
      <ThemeProvider theme={prefersDarkMode ? darkTheme : lightTheme}>
            <CssBaseline />
            <Suspense fallback={<Loader />}><AppHeader />  </Suspense> 
            <Suspense fallback={<Loader />}>
                    <Disabeled />
                </Suspense>
      
            <Box sx={{ bgcolor: 'background.paper', p: 6 }} component="footer">
            <Suspense fallback={<Loader />}><Copyright /></Suspense>
            </Box>
        </ThemeProvider>
    );
  }
}
