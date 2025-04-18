import ReactDOM from 'react-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Imprint from './Imprint';
import Privacy from './Privacy';
import NotFound from './NotFound';
import Queue from './Queue';
import Manage from './Manage';
import Login from './Login';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import Playlist from './Playlist';

ReactDOM.render(
  <ThemeProvider theme={theme}>
    {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
    <CssBaseline />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />}></Route>
        <Route path="/settings/" element={<Manage />}></Route>
        <Route path="/s/:id" element={<Queue />}></Route>
        <Route path="/playlist/:playlist" element={<Playlist />}></Route>
        <Route path="/imprint" element={<Imprint />}></Route>
        <Route path="/privacy" element={<Privacy />}></Route>
        <Route path='*' exact={true} element={<NotFound />} /></Routes>
    </BrowserRouter>
    
  </ThemeProvider>,
  document.querySelector('#root'),
);
