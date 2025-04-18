import { Box } from "@mui/system";
import { Typography, Link } from "@mui/material";

export default function Copyright() {
    return (
        <Box>
            <Typography variant="body2" color="text.secondary" align="center">
                <Link color="inherit" href={window.location.origin+"/imprint"}>
                Impressum
                </Link> &#8226; <Link color="inherit" href={window.location.origin+"/privacy"}>
                     Datenschutz
                </Link> &#8226; <Link color="inherit" href={"https://status.musicq.de/"}>
                    Status
                </Link>
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
                {'Copyright © '}
                <Link color="inherit" href={window.location.origin}>
                    musicq.de
                </Link>{' 2021-'}
                {new Date().getFullYear()}
            </Typography>
        </Box>
    );
}