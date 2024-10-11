import React, { useState } from 'react';
import { TextField, Button, Typography, Paper, Grid, ToggleButton, ToggleButtonGroup } from '@mui/material';

const AddReview: React.FC = () => {
  const [inputMode, setInputMode] = useState('free-form');
  const [reviewText, setReviewText] = useState('');
  const [reviewer, setReviewer] = useState('Ted'); // Prefill reviewer for now
  const [restaurant, setRestaurant] = useState('');
  const [location, setLocation] = useState('');
  const [dateOfVisit, setDateOfVisit] = useState('');
  const [itemsOrdered, setItemsOrdered] = useState<string[]>(['']);
  const [ratings, setRatings] = useState<string[]>(['']);
  const [overallExperience, setOverallExperience] = useState('');

  const handleInputModeChange = (event: React.MouseEvent<HTMLElement>, newMode: string) => {
    if (newMode) {
      setInputMode(newMode);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMode === 'free-form') {
      const reviewData = { reviewText };
      console.log('Submitting free-form review data:', reviewData);
      // Send free-form reviewData to the backend API for ChatGPT processing
    } else {
      const reviewData = {
        reviewer,
        restaurant,
        location,
        dateOfVisit,
        itemsOrdered,
        ratings,
        overallExperience,
      };
      console.log('Submitting structured review data:', reviewData);
      // Send structured reviewData to the backend API to save in the database
    }
  };

  return (
    <Paper style={{ padding: 20 }}>
      <Typography variant="h4" gutterBottom>
        Add a Review
      </Typography>
      <ToggleButtonGroup
        value={inputMode}
        exclusive
        onChange={handleInputModeChange}
        aria-label="input mode"
        style={{ marginBottom: 20 }}
      >
        <ToggleButton value="free-form" aria-label="free-form input">
          Free-Form Input
        </ToggleButton>
        <ToggleButton value="structured" aria-label="structured form">
          Structured Form
        </ToggleButton>
      </ToggleButtonGroup>
      
      <form onSubmit={handleSubmit}>
        {inputMode === 'free-form' ? (
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
        ) : (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Reviewer"
                value={reviewer}
                onChange={(e) => setReviewer(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Restaurant Name"
                value={restaurant}
                onChange={(e) => setRestaurant(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="date"
                label="Date of Visit"
                InputLabelProps={{ shrink: true }}
                value={dateOfVisit}
                onChange={(e) => setDateOfVisit(e.target.value)}
                required
              />
            </Grid>

            {itemsOrdered.map((item, index) => (
              <Grid container item xs={12} spacing={1} key={index}>
                <Grid item xs={5}>
                  <TextField
                    fullWidth
                    label={`Item ${index + 1}`}
                    value={item}
                    onChange={(e) => {
                      const newItems = [...itemsOrdered];
                      newItems[index] = e.target.value;
                      setItemsOrdered(newItems);
                    }}
                    required
                  />
                </Grid>
                <Grid item xs={5}>
                  <TextField
                    fullWidth
                    label={`Rating for Item ${index + 1}`}
                    value={ratings[index]}
                    onChange={(e) => {
                      const newRatings = [...ratings];
                      newRatings[index] = e.target.value;
                      setRatings(newRatings);
                    }}
                  />
                </Grid>
              </Grid>
            ))}

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Overall Experience"
                multiline
                rows={4}
                value={overallExperience}
                onChange={(e) => setOverallExperience(e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <Button type="submit" variant="contained" color="primary" fullWidth>
                Submit Review
              </Button>
            </Grid>
          </Grid>
        )}
      </form>
    </Paper>
  );
};

export default AddReview;
