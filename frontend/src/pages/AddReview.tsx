import React, { useState } from 'react';
import { TextField, Button, Typography, Paper, Grid } from '@mui/material';

const AddReview: React.FC = () => {
  const [reviewText, setReviewText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const reviewData = {
      reviewText,
    };
    console.log('Submitting review data:', reviewData);
    // Here, you would send the reviewData to the backend API to process the review using ChatGPT.
  };

  return (
    <Paper style={{ padding: 20 }}>
      <Typography variant="h4" gutterBottom>
        Add a Review
      </Typography>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Write Your Review"
              multiline
              rows={8}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Describe your dining experience in detail..."
              required
            />
          </Grid>
          <Grid item xs={12}>
            <Button type="submit" variant="contained" color="primary" fullWidth>
              Submit Review
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default AddReview;
