import React, { Suspense } from 'react';
import { Box, Grid, Card, CardContent, Typography } from '@mui/material';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';
import useMediaQuery from '@mui/material/useMediaQuery';
import Cookies from 'js-cookie';
import CircularProgress from '@mui/material/CircularProgress';
const AppHeader = React.lazy(() => import('./Header'));
const Copyright = React.lazy(() => import('./Footer'));
const axios = require('axios');

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


export default function Login() {
  const user = Cookies.get('username')
  const secret = Cookies.get('secret')
  const queryParams = new URLSearchParams(window.location.search);
  const code = queryParams.get('code');
  if (secret != undefined || user != undefined){
    window.location.replace("/settings");
  } 
  
  if (code != undefined){
    axios.get('https://api.musicq.de/v2/auth?code=' + code)
    .then(function (response) {
      Cookies.set("username", response.data.username)
      Cookies.set("secret", response.data.secret)
      window.location.replace("/settings");
    }).catch(function (error) {
      console.log(error);
    });
  } 
  function auth() {
    axios.get('https://api.musicq.de/v2/auth')
    .then(function (response) {
      window.location = response.data.auth_url;
    }).catch(function (error) {
        console.log(error);
    });
  }
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
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
            <Box>
              <Box>
                <Card elevation={16} sx={{ minWidth: 275, maxWidth: 500}}>
                  <CardContent>
                    <Typography gutterBottom variant="h5" component="div">
                      Willkommen auf musicq.de
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Melde dich mit Spotify an und lasse deine Freunde mit entscheiden was als nächstes läuft.
                      <br></br>
                      Perfekt für Partys, Autofahrten oder entspannte Abende.
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            </Box>
            <Box textAlign='center' sx={{ p: 2}}>
              <Button variant="contained" onClick={() => auth()}>Login with Spotify</Button>
            </Box>
            <Typography variant="body2" color="text.secondary" style={{textAlign: "center"}}>
              Durch das Einloggen stimmst du dem Speichern notwendiger Cookies zu.
            </Typography>
          </Container>
        </Box>
      </Grid>
      <Box sx={{ bgcolor: 'background.paper', p: 6 }} component="footer">
            <Suspense fallback={<Loader />}><Copyright /></Suspense>
            </Box>
        </ThemeProvider>
    </main>
  );
}
