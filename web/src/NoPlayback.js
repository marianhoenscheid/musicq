import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import { CircularProgress, Container, Alert} from '@mui/material';


export default function NoPlayback() {
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
                Keine Wiedergabe aktiv
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
