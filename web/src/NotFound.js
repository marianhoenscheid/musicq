import React, { Suspense } from 'react';
import { Alert, Grid, Box, Container, Button } from "@mui/material";
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';
import useMediaQuery from '@mui/material/useMediaQuery';
import CircularProgress from '@mui/material/CircularProgress';
const AppHeader = React.lazy(() => import('./Header'));
const Copyright = React.lazy(() => import('./Footer'));

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


export default function NotFound() {
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
    return (
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
                textAlign='center'
                >
                <Container>
                    <Box>
                    <Alert variant="filled" severity="error" action={
                        <Button color="inherit" size="small" onClick={() => history.back()}>
                        Zurück
                        </Button>
                    }>
                    Error 404 Page Not Found - Diese Seite konnte nicht gefunden werden.
                    </Alert> 
                    </Box>
                </Container>
                </Box>     
            </Grid>
            <Box sx={{ bgcolor: 'background.paper', p: 6 }} component="footer">
            <Suspense fallback={<Loader />}><Copyright /></Suspense>
            </Box>
        </ThemeProvider>
    );
}
