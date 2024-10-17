import React, { useState } from 'react';
import {
  TextField,
  Button,
  Typography,
  Paper,
  Grid,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

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

  const handleAddItem = () => {
    setItemsOrdered([...itemsOrdered, '']);
    setRatings([...ratings, '']);
  };

  const handleRemoveItem = (index: number) => {
    const newItemsOrdered = itemsOrdered.filter((_, i) => i !== index);
    const newRatings = ratings.filter((_, i) => i !== index);
    setItemsOrdered(newItemsOrdered);
    setRatings(newRatings);
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMode === 'free-form') {
      const reviewData = { reviewText };
      try {
        const response = await fetch('http://localhost:5000/api/reviews/free-form', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reviewData),
        });
        const data = await response.json();
        console.log('Free-form review saved:', data);
      } catch (error) {
        console.error('Error saving free-form review:', error);
      }
    } else {
      // Combine itemsOrdered and ratings into objects for each item
      const formattedRatings = itemsOrdered.map((item, index) => ({
        item: item,
        rating: ratings[index] || '',
      }));
  
      const structuredData = {
        reviewer,
        restaurant,
        location,
        dateOfVisit,
        itemsOrdered,
        ratings: formattedRatings, // Use the formatted ratings here
        overallExperience,
      };
      try {
        const response = await fetch('http://localhost:5000/api/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(structuredData),
        });
        const data = await response.json();
        console.log('Structured review saved:', data);
      } catch (error) {
        console.error('Error saving structured review:', error);
      }
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
        )}
      </form>
    </Paper>
  );
};

export default AddReview;
