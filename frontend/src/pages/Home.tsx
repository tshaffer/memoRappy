import React from 'react';
import { Typography, Grid, Paper } from '@mui/material';

const Home: React.FC = () => {
  return (
    <Paper style={{ padding: 20 }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="h4" gutterBottom>
            Welcome to MemoRapp!
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body1">
            Your restaurant reviews at your fingertips.
          </Typography>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default Home;
