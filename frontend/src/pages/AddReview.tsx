import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Typography,
  Paper,
  Grid,
} from '@mui/material';

const AddReview: React.FC = () => {
  const [restaurantName, setRestaurantName] = useState(''); // New state for restaurant name
  const [reviewText, setReviewText] = useState('');
  const [parsedDetails, setParsedDetails] = useState<any>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Generate a session ID for each new review session
    if (!sessionId) {
      setSessionId(generateSessionId());
    }
  }, [sessionId]);

  const handlePreview = async () => {
    if (!sessionId) return;

    try {
      const response = await fetch('/api/reviews/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantName, reviewText, sessionId }),
      });

      const data = await response.json();
      setParsedDetails(data.parsedData);
      setPreviewMode(true); // Enter preview mode
    } catch (error) {
      console.error('Error previewing review:', error);
    }
  };

  const handleEdit = () => {
    setPreviewMode(false);
    setParsedDetails(null); // Reset preview data to allow editing
  };

  const handleSubmit = async () => {

    if (!parsedDetails) return;

    try {
      const response = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parsedData: { ...parsedDetails, fullReviewText: reviewText, restaurantName },
        }),
      });

      const data = await response.json();
      console.log('Review submitted:', data);
      // resetForm(); // Clear fields after successful submission
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  };

  const resetForm = () => {
    setRestaurantName(''); // Clear restaurant name
    setReviewText('');
    setParsedDetails(null);
    setPreviewMode(false);
    setSessionId(generateSessionId());
  };

  const generateSessionId = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  };

  return (
    <Paper style={{ padding: 20 }}>
      <Typography variant="h4" gutterBottom>
        Add a Review
      </Typography>

      {!previewMode ? (
        <>
          <TextField
            fullWidth
            label="Restaurant Name"
            value={restaurantName}
            onChange={(e) => setRestaurantName(e.target.value)}
            placeholder="Enter the restaurant name"
            required
          />
          <TextField
            fullWidth
            label="Write Your Review"
            multiline
            rows={8}
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Describe your dining experience in detail..."
            required
            style={{ marginTop: 20 }}
          />
          <Grid container spacing={2} style={{ marginTop: 20 }}>
            <Grid item xs={6}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handlePreview}
                disabled={!restaurantName || !reviewText}
              >
                Preview
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button variant="contained" color="secondary" fullWidth onClick={resetForm}>
                Clear
              </Button>
            </Grid>
          </Grid>
        </>
      ) : (
        <>
          <Typography variant="h6">Preview of Your Review</Typography>
          <Typography><strong>Reviewer:</strong> {parsedDetails.reviewer}</Typography>
          <Typography><strong>Restaurant:</strong> {parsedDetails.restaurantName || restaurantName}</Typography>
          <Typography><strong>Location:</strong> {parsedDetails.location}</Typography>
          <Typography><strong>Date of Visit:</strong> {parsedDetails.dateOfVisit}</Typography>
          <Typography><strong>Overall Experience:</strong> {parsedDetails.overallExperience}</Typography>

          <Typography><strong>Items Ordered:</strong></Typography>
          <ul>
            {parsedDetails.itemsOrdered.map((item: string, idx: number) => (
              <li key={idx}>
                {item} - {parsedDetails.ratings[idx]?.rating || 'No rating provided'}
              </li>
            ))}
          </ul>

          <Typography><strong>Keywords:</strong></Typography>
          <ul>
            {parsedDetails.keywords.map((keyword: string, idx: number) => (
              <li key={idx}>
                {keyword}
              </li>
            ))}
          </ul>

          <Typography><strong>Phrases:</strong></Typography>
          <ul>
            {parsedDetails.phrases.map((phrase: string, idx: number) => (
              <li key={idx}>
                {phrase}
              </li>
            ))}
          </ul>

          <Grid container spacing={2} style={{ marginTop: 20 }}>
            <Grid item xs={6}>
              <Button variant="contained" color="primary" fullWidth onClick={handleSubmit}>
                Submit
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button variant="contained" color="secondary" fullWidth onClick={handleEdit}>
                Edit
              </Button>
            </Grid>
          </Grid>
        </>
      )}
    </Paper>
  );
};

export default AddReview;
