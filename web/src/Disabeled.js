import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import { Container, Alert, CircularProgress} from '@mui/material';

export default function Disabled() {
  return (
    <main>
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
              <Alert variant="filled" severity="info">
              Die Freigabe wurde durch den Nutzer deaktiviert
              </Alert>
              </Box>
            </Box>
          </Container>
        </Box>     
        <Box>
            <CircularProgress />
        </Box>
      </Grid>
    </main>
  );
}
