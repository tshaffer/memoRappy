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
  Card,
} from '@mui/material';
import { ReviewEntity } from '../types';

const AddReview: React.FC = () => {
  const [restaurantName, setRestaurantName] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [parsedDetails, setParsedDetails] = useState<ReviewEntity | null>(null);
  const [displayTab, setDisplayTab] = useState(0); // 0 = Review Text, 1 = Extracted Information, 2 = Chat History
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai'; message: string | ReviewEntity }[]>([]);
  const [chatInput, setChatInput] = useState<string>('');

  useEffect(() => {
    if (!sessionId) {
      setSessionId(generateSessionId());
    }
  }, [sessionId]);

  const handleTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setDisplayTab(newValue);
  };

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
      setChatHistory([...chatHistory, { role: 'user', message: reviewText }, { role: 'ai', message: data.parsedData }]);
      setDisplayTab(1);
    } catch (error) {
      console.error('Error previewing review:', error);
    }
  };

  const handleChat = async () => {
    if (!sessionId || !chatInput) return;
    try {
      const response = await fetch('/api/reviews/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput: chatInput, sessionId, fullReviewText: reviewText }),
      });
      const data = await response.json();

      setParsedDetails(data.parsedData);
      setReviewText(data.updatedReviewText);
      setChatHistory([...chatHistory, { role: 'user', message: chatInput }, { role: 'ai', message: data.parsedData }]);
      setChatInput('');
      setDisplayTab(2);
    } catch (error) {
      console.error('Error during chat:', error);
    }
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
      resetForm();
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  };

  const resetForm = () => {
    setRestaurantName('');
    setReviewText('');
    setParsedDetails(null);
    setSessionId(generateSessionId());
    setChatHistory([]);
  };

  const generateSessionId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

  const renderFormattedAIResponse = (data: ReviewEntity) => (
    <Box sx={{ textAlign: 'left' }}>
      <Typography><strong>Reviewer:</strong> {data.reviewer || 'Not provided'}</Typography>
      <Typography><strong>Restaurant:</strong> {data.restaurantName || 'Not provided'}</Typography>
      <Typography><strong>Location:</strong> {data.location || 'Not provided'}</Typography>
      <Typography><strong>Date of Visit:</strong> {data.dateOfVisit || 'Not provided'}</Typography>
      <Typography><strong>Overall Experience:</strong> {data.overallExperience || 'Not provided'}</Typography>
      <Typography><strong>Items Ordered:</strong></Typography>
      <ul>
        {data.itemsOrdered.map((item, idx) => (
          <li key={idx}>
            {item} - {data.ratings[idx]?.rating || 'No rating provided'}
          </li>
        ))}
      </ul>
    </Box>
  );

  return (
    <Paper style={{ padding: 20 }}>
      <Typography variant="h4" gutterBottom>
        Add a Review
      </Typography>

      {/* Display Toggle Tabs */}
      <Tabs value={displayTab} onChange={handleTabChange} indicatorColor="primary" textColor="primary">
        <Tab label="Review Text" />
        <Tab label="Extracted Information" />
        <Tab label="Chat History" />
      </Tabs>

      <Box mt={2}>
        {/* Display Content Based on Active Tab */}
        {displayTab === 0 && (
          <Box>
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
              multiline
              rows={8}
              label="Write Your Review"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Describe your dining experience in detail..."
              required
            />
          </Box>
        )}
        {displayTab === 1 && parsedDetails && renderFormattedAIResponse(parsedDetails)}
        {displayTab === 2 && (
          <Box>
            {chatHistory.map((msg, idx) => (
              <Box
                key={idx}
                sx={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  mb: 2,
                }}
              >
                <Card
                  sx={{
                    backgroundColor: msg.role === 'user' ? 'lightgrey' : 'white',
                    padding: 2,
                    maxWidth: '80%',
                    borderRadius: 2,
                  }}
                >
                  {typeof msg.message === 'string' ? (
                    <Typography variant="body1">{msg.message}</Typography>
                  ) : (
                    renderFormattedAIResponse(msg.message as ReviewEntity)
                  )}
                </Card>
              </Box>
            ))}
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Enter your message..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleChat()}
              style={{ marginTop: 10 }}
            />
          </Box>
        )}
      </Box>

      {/* Action Buttons */}
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
            onClick={handleChat}
            disabled={!chatInput}
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
