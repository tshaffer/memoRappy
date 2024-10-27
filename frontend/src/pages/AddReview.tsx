import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Typography,
  Paper,
  Grid,
  Tabs,
  Tab,
  Box,
} from '@mui/material';
import { ReviewEntity } from '../types';

const AddReview: React.FC = () => {
  const [restaurantName, setRestaurantName] = useState(''); // State for restaurant name
  const [reviewText, setReviewText] = useState('');
  const [parsedDetails, setParsedDetails] = useState<ReviewEntity | null>(null);
  const [tabIndex, setTabIndex] = useState(0); // Tab index for preview, review text, and chat history
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<string[]>([]); // Holds chat history

  useEffect(() => {
    // Generate session ID if one doesn't exist
    if (!sessionId) {
      setSessionId(generateSessionId());
    }
  }, [sessionId]);

  // Handle tab change for displaying different information
  const handleTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabIndex(newValue);
  };

  // Handle preview button click
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
      setChatHistory([...chatHistory, `User: ${reviewText}`, `AI: ${JSON.stringify(data.parsedData, null, 2)}`]);
      setTabIndex(0); // Set tab to "Extracted Information" on preview
    } catch (error) {
      console.error('Error previewing review:', error);
    }
  };

  // Handle chat interaction for continued conversation with ChatGPT
  const handleChat = async (userInput: string) => {
    if (!sessionId) return;

    try {
      const response = await fetch('/api/reviews/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput, sessionId }),
      });

      const data = await response.json();
      setParsedDetails(data.parsedData);
      setChatHistory([...chatHistory, `User: ${userInput}`, `AI: ${JSON.stringify(data.parsedData, null, 2)}`]);
      setTabIndex(2); // Set tab to "Chat History"
    } catch (error) {
      console.error('Error during chat:', error);
    }
  };

  // Handle final review submission
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
      resetForm(); // Reset after submission
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  };

  const resetForm = () => {
    setRestaurantName(''); // Clear restaurant name
    setReviewText('');
    setParsedDetails(null);
    setSessionId(generateSessionId());
    setChatHistory([]);
  };

  const generateSessionId = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  };

  return (
    <Paper style={{ padding: 20 }}>
      <Typography variant="h4" gutterBottom>
        Add a Review
      </Typography>

      {/* Input fields for restaurant name and review text */}
      <TextField
        fullWidth
        label="Restaurant Name"
        value={restaurantName}
        onChange={(e) => setRestaurantName(e.target.value)}
        placeholder="Enter the restaurant name"
        required
        style={{ marginBottom: 20 }}
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
        style={{ marginBottom: 20 }}
      />

      {/* Tabs for display modes */}
      <Tabs value={tabIndex} onChange={handleTabChange} indicatorColor="primary" textColor="primary">
        <Tab label="Extracted Information" />
        <Tab label="Review Text" />
        <Tab label="Chat History" />
      </Tabs>

      <Box mt={2}>
        {/* Extracted Information tab content */}
        {tabIndex === 0 && parsedDetails && (
          <Box>
            <Typography><strong>Reviewer:</strong> {parsedDetails.reviewer}</Typography>
            <Typography><strong>Restaurant:</strong> {parsedDetails.restaurantName}</Typography>
            <Typography><strong>Location:</strong> {parsedDetails.location}</Typography>
            <Typography><strong>Date of Visit:</strong> {parsedDetails.dateOfVisit}</Typography>
            <Typography><strong>Overall Experience:</strong> {parsedDetails.overallExperience}</Typography>
            <Typography><strong>Items Ordered:</strong></Typography>
            <ul>
              {parsedDetails.itemsOrdered.map((item, idx) => (
                <li key={idx}>
                  {item} - {parsedDetails.ratings[idx]?.rating || 'No rating provided'}
                </li>
              ))}
            </ul>
          </Box>
        )}

        {/* Review Text tab content */}
        {tabIndex === 1 && (
          <TextField
            fullWidth
            multiline
            rows={8}
            variant="outlined"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Describe your dining experience in detail..."
          />
        )}

        {/* Chat History tab content */}
        {tabIndex === 2 && (
          <Box>
            {chatHistory.map((msg, idx) => (
              <Typography key={idx}>{msg}</Typography>
            ))}
          </Box>
        )}
      </Box>

      {/* Action buttons */}
      <Grid container spacing={2} style={{ marginTop: 20 }}>
        <Grid item xs={4}>
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
        <Grid item xs={4}>
          <Button
            variant="contained"
            color="secondary"
            fullWidth
            onClick={() => handleChat("Refine information")} // Use modal or input for detailed chat
          >
            Chat
          </Button>
        </Grid>
        <Grid item xs={4}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleSubmit}
            disabled={!parsedDetails}
          >
            Submit
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default AddReview;
