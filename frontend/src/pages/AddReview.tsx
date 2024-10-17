import React, { useState } from 'react';
import { TextField, Button, Typography, Paper, Grid } from '@mui/material';

const AddReview: React.FC = () => {
  const [reviewer, setReviewer] = useState('');
  const [restaurant, setRestaurant] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [itemsOrdered, setItemsOrdered] = useState('');
  const [overallExperience, setOverallExperience] = useState('');

  // Function to handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const reviewData = {
      reviewer,
      restaurant,
      location,
      date,
      itemsOrdered,
      overallExperience,
    };

    console.log('Review Submitted:', reviewData);
    // Here you can make an API call to save the reviewData in the database
  };

  return (
    <Paper style={{ padding: 20 }}>
      <Typography variant="h4" gutterBottom>
        Add a Review
      </Typography>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Reviewer"
              value={reviewer}
              onChange={(e) => setReviewer(e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Restaurant"
              value={restaurant}
              onChange={(e) => setRestaurant(e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Date (YYYY-MM-DD)"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Items Ordered"
              value={itemsOrdered}
              onChange={(e) => setItemsOrdered(e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Overall Experience"
              value={overallExperience}
              onChange={(e) => setOverallExperience(e.target.value)}
              multiline
              rows={4}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <Button variant="contained" color="primary" type="submit" fullWidth>
              Submit Review
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default AddReview;
