import React, { useState } from 'react';
import { TextField, Button, Typography, Paper, Grid } from '@mui/material';

const QueryReviews: React.FC = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<any>(null);

  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const apiResponse = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }), // Send the natural language query to your backend
      });
      const result = await apiResponse.json();
      setResponse(result); // Display the result to the user
    } catch (error) {
      console.error('Error handling query:', error);
    }
  };

  return (
    <Paper style={{ padding: 20 }}>
      <Typography variant="h4" gutterBottom>
        Ask a Question About Your Reviews
      </Typography>
      <form onSubmit={handleQuerySubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Ask a question"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="E.g., What restaurants did I visit in the past year?"
              required
            />
          </Grid>
          <Grid item xs={12}>
            <Button type="submit" variant="contained" color="primary" fullWidth>
              Submit Query
            </Button>
          </Grid>
        </Grid>
      </form>

      {response && (
        <div>
          <Typography variant="h5" gutterBottom>
            Query Results
          </Typography>
          <pre>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}
    </Paper>
  );
};

export default QueryReviews;
