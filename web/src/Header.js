import { Typography } from "@mui/material";
import { AppBar, Toolbar, Button } from "@mui/material";
import Cookies from 'js-cookie';

export default function AppHeader() {
    const user = Cookies.get('username')
    const secret = Cookies.get('secret')

    function logout(){
        document.cookie = "secret=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC";
        document.cookie = "username=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC";
        Cookies.remove('secret', { path: '/', domain: window.location.hostname })
        Cookies.remove('username', { path: '/', domain: window.location.hostname })
        window.location.reload();
    }
    function LogoutButton(){
        if (user === undefined || secret === undefined){
            return <div></div>
        } else {
            return (<Button color="inherit" onClick={() => {logout()}}>Logout</Button>);
        }
    }
    return (
        <AppBar position="sticky">
            <Toolbar>
                <Typography variant="h6" color="inherit" noWrap sx={{ flexGrow: 1 }}>
                    musicq.de
                </Typography>
                <LogoutButton />
            </Toolbar>
        </AppBar>
    );
}