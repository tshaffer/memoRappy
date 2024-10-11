import React, { useState } from 'react';
import { TextField, Button, Typography, Grid, Paper, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

const AddReview: React.FC = () => {
  const [reviewer, setReviewer] = useState('Ted'); // Prefill reviewer for now
  const [restaurant, setRestaurant] = useState('');
  const [location, setLocation] = useState('');
  const [dateOfVisit, setDateOfVisit] = useState('');
  const [itemsOrdered, setItemsOrdered] = useState<string[]>(['']);
  const [ratings, setRatings] = useState<string[]>(['']);
  const [overallExperience, setOverallExperience] = useState('');

  const handleItemChange = (index: number, value: string) => {
    const newItems = [...itemsOrdered];
    newItems[index] = value;
    setItemsOrdered(newItems);
  };

  const handleRatingChange = (index: number, value: string) => {
    const newRatings = [...ratings];
    newRatings[index] = value;
    setRatings(newRatings);
  };

  const handleAddItem = () => {
    setItemsOrdered([...itemsOrdered, '']);
    setRatings([...ratings, '']);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = itemsOrdered.filter((_, i) => i !== index);
    const newRatings = ratings.filter((_, i) => i !== index);
    setItemsOrdered(newItems);
    setRatings(newRatings);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const reviewData = {
      reviewer,
      restaurant,
      location,
      dateOfVisit,
      itemsOrdered,
      ratings,
      overallExperience,
    };
    console.log('Submitting review data:', reviewData);
    // Here, you would send the reviewData to the backend API to store the review in the database.
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
                  onChange={(e) => handleItemChange(index, e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={5}>
                <TextField
                  fullWidth
                  label={`Rating for Item ${index + 1}`}
                  value={ratings[index]}
                  onChange={(e) => handleRatingChange(index, e.target.value)}
                />
              </Grid>
              <Grid item xs={2} style={{ display: 'flex', alignItems: 'center' }}>
                <IconButton onClick={() => handleRemoveItem(index)} aria-label="remove item">
                  <RemoveIcon />
                </IconButton>
              </Grid>
            </Grid>
          ))}

          <Grid item xs={12}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddItem}
              style={{ marginBottom: 20 }}
            >
              Add Another Item
            </Button>
          </Grid>

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
      </form>
    </Paper>
  );
};

export default AddReview;
