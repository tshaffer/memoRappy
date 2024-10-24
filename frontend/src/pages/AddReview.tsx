import React, { useState } from 'react';
import {
  TextField,
  Button,
  Typography,
  Paper,
  Grid,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
} from '@mui/material';

// Manually define SpeechRecognition and webkitSpeechRecognition types
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const AddReview: React.FC = () => {
  const [inputMode, setInputMode] = useState('free-form');
  const [reviewText, setReviewText] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [parsedDetails, setParsedDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false); // To show a loader during the OpenAI call

  // Toggle free-form or structured input
  const handleInputModeChange = (event: React.MouseEvent<HTMLElement>, newMode: string) => {
    if (newMode) {
      setInputMode(newMode);
    }
  };

  // Handle Preview Button Click
  const handlePreview = async () => {
    setLoading(true);
    try {
      const prompt = `Extract the following information from this review:
      - Reviewer name
      - Restaurant name
      - Location
      - Date of visit (in the format YYYY-MM-DD)
      - List of items ordered
      - Ratings for each item
      - Overall experience
      Review: "${reviewText}"`;

      // Call to OpenAI for parsing the review text
      const response = await fetch('/api/reviews/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewText }),
      });
      const parsedResponse = await response.json();

      if (parsedResponse.error) {
        console.error('Error parsing review:', parsedResponse.error);
      } else {
        setParsedDetails(parsedResponse); // Save the parsed details
        setIsPreview(true); // Switch to preview mode
      }
    } catch (error) {
      console.error('Error fetching preview:', error);
    }
    setLoading(false);
  };

  // Handle Back Button
  const handleBack = () => {
    setIsPreview(false);
  };

  // Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Submit parsed details or handle structured submission here
    try {
      const response = await fetch('/api/reviews/free-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedDetails),
      });
      const data = await response.json();
      console.log('Review submitted:', data);
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  };

  console.log('isPreview', isPreview);

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

      {!isPreview ? (
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
            <Button
              variant="contained"
              color="primary"
              onClick={handlePreview}
              disabled={loading || !reviewText}
              fullWidth
            >
              {loading ? <CircularProgress size={24} /> : 'Preview'}
            </Button>
          </Grid>
        </Grid>
      ) : (
        <>
          <Typography variant="h6" gutterBottom>
            Review Preview
          </Typography>
          <Paper style={{ padding: 20, marginBottom: 20 }}>
            <Typography><strong>Reviewer:</strong> {parsedDetails.reviewer}</Typography>
            <Typography><strong>Restaurant:</strong> {parsedDetails.restaurant}</Typography>
            <Typography><strong>Location:</strong> {parsedDetails.location}</Typography>
            <Typography><strong>Date of Visit:</strong> {parsedDetails.dateOfVisit}</Typography>
            <Typography><strong>Items Ordered:</strong></Typography>
            <ul>
              {parsedDetails.itemsOrdered.map((item: string, idx: number) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
            <Typography><strong>Overall Experience:</strong> {parsedDetails.overallExperience}</Typography>
          </Paper>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Button variant="contained" color="primary" onClick={handleSubmit} fullWidth>
                Submit
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Button variant="outlined" onClick={handleBack} fullWidth>
                Back
              </Button>
            </Grid>
          </Grid>
        </>
      )}
    </Paper>
  );
};

export default AddReview;
