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
import { AddReviewDisplayTabs, GoogleLocation, ReviewEntity } from '../types';

const AddReview: React.FC = () => {
  const [restaurantName, setRestaurantName] = useState('');
  const [userLocation, setUserLocation] = useState<string>('');
  const [reviewText, setReviewText] = useState('');
  const [parsedDetails, setParsedDetails] = useState<ReviewEntity | null>(null);
  const [displayTab, setDisplayTab] = useState(AddReviewDisplayTabs.ReviewText);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai'; message: string | ReviewEntity }[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [placeVerified, setPlaceVerified] = useState<boolean | null>(null);
  const [googleLocation, setGoogleLocation] = useState<GoogleLocation | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setSessionId(generateSessionId());
    }
  }, [sessionId]);

  const handleTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setDisplayTab(newValue);
  };

  const handleVerifyLocation = async () => {
    try {
      const response = await fetch('/api/reviews/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantName, location: userLocation }),
      });
      if (response.ok) {
        const data: GoogleLocation | null = await response.json();
        if (data) {
          setGoogleLocation(data);
          setPlaceVerified(true);
        } else {
          setPlaceVerified(false); // Couldn’t find location
        }
      } else {
        setPlaceVerified(false); // Couldn’t find location
      }

    } catch (error) {
      console.error('Error verifying location:', error);
      setPlaceVerified(false);
    }
  };

  const handlePreview = async () => {
    if (!sessionId) return;
    try {
      const response = await fetch('/api/reviews/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantName, locationInfo: googleLocation, reviewText, sessionId }),
      });
      const data = await response.json();
      setParsedDetails(data.parsedData);
      setGoogleLocation(data.parsedData.googleLocation);
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
          parsedData: { ...parsedDetails, fullReviewText: reviewText, restaurantName, googleLocation },
        }),
      });
      const data = await response.json();
      console.log('Review submitted:', data);
      // resetForm();
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  };

  // const resetForm = () => {
  //   setRestaurantName('');
  //   setUserLocation('');
  //   setReviewText('');
  //   setParsedDetails(null);
  //   setPlaceVerified(null);
  //   setGoogleLocation(null);
  //   setSessionId(generateSessionId());
  //   setChatHistory([]);
  // };

  const generateSessionId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

  const renderFormattedAIResponse = (reviewEntity: ReviewEntity) => {
    const googleLocation: GoogleLocation = reviewEntity.googleLocation;
    return (
      <Box sx={{ textAlign: 'left' }}>
        <Typography><strong>Reviewer:</strong> {reviewEntity.reviewer || 'Not provided'}</Typography>
        <Typography><strong>Restaurant:</strong> {reviewEntity.restaurantName || 'Not provided'}</Typography>
        <Typography><strong>Location:</strong> {reviewEntity.userLocation || 'Not provided'}</Typography>
        <Typography><strong>Date of Visit:</strong> {reviewEntity.dateOfVisit || 'Not provided'}</Typography>
        <Typography><strong>Overall Experience:</strong> {reviewEntity.overallExperience || 'Not provided'}</Typography>
        <Typography><strong>Items Ordered:</strong></Typography>
        <ul>
          {reviewEntity.itemsOrdered.map((item, idx) => (
            <li key={idx}>
              {item} - {reviewEntity.ratings[idx]?.rating || 'No rating provided'}
            </li>
          ))}
        </ul>
        <Typography><strong>Retrieved Location:</strong>{googleLocation?.address}</Typography>
      </Box>
    )
  };

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
        {displayTab === AddReviewDisplayTabs.ReviewText && (
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
              label="Location"
              value={userLocation}
              onChange={(e) => setUserLocation(e.target.value)}
              placeholder="Enter the location (e.g., City or Address)"
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
            <Button variant="contained" color="primary" onClick={handleVerifyLocation} style={{ marginTop: 20 }}>
              Retrieve Location
            </Button>
            {placeVerified === false && (
              <Box mt={2}>
                <Typography color="error">
                  Location not found. Please edt the location and retry or proceed without verification.
                </Typography>
              </Box>
            )}
            {placeVerified && googleLocation && (
              <Box mt={2}>
                <Typography>{googleLocation.name}</Typography>
                <Typography>{googleLocation.address}</Typography>
              </Box>
            )}
          </Box>
        )}
        {displayTab === AddReviewDisplayTabs.ExtractedInformation && parsedDetails && renderFormattedAIResponse(parsedDetails)}
        {displayTab === AddReviewDisplayTabs.ChatHistory && (
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

