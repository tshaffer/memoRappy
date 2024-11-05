import React, { useState, useEffect, useRef } from 'react';
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
import { LoadScript, Autocomplete } from '@react-google-maps/api';
import { AddReviewDisplayTabs, ChatResponse, MemoRappPlaceProperties, ParsedReviewProperties, ReviewEntity } from '../types';

const AddReview: React.FC = () => {

  const formatDateToMMDDYYYY = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${month}/${day}/${year}`;
  };

  const getFormattedDate = () => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const year = today.getFullYear();
    return `${year}-${month}-${day}`;
  };

  const [restaurantName, setRestaurantName] = useState('');
  const [userLocation, setUserLocation] = useState<string>('');
  const [dateOfVisit, setDateOfVisit] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [parsedReviewProperties, setParsedReviewProperties] = useState<ParsedReviewProperties | null>(null);
  const [displayTab, setDisplayTab] = useState(AddReviewDisplayTabs.ReviewText);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai'; message: string | ParsedReviewProperties }[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    setDateOfVisit(getFormattedDate());
    if (!sessionId) {
      setSessionId(generateSessionId());
    }
  }, [sessionId]);

  const handleTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setDisplayTab(newValue);
  };

  const handlePlaceChanged = () => {
    console.log('Place changed:', autocompleteRef.current?.getPlace());
    if (autocompleteRef.current) {
      const place: google.maps.places.PlaceResult = autocompleteRef.current.getPlace();
      if (place && place.geometry) {
        setRestaurantName(place.name || '');
        setUserLocation(place.formatted_address || '');
      }
    }
  };

  const handlePreview = async () => {
    if (!sessionId) return;
    try {
      const previewBody: any = {
        structuredReviewProperties: { restaurantName, userLocation, dateOfVisit },
        reviewText,
        sessionId,
      };
      const response = await fetch('/api/reviews/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(previewBody),
      });
      const data = await response.json();
      setParsedReviewProperties(data.parsedReviewProperties);
      setChatHistory([...chatHistory, { role: 'user', message: reviewText }, { role: 'ai', message: data.parsedReviewProperties }]);
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
        body: JSON.stringify({ userInput: chatInput, sessionId, reviewText }),
      });
      const chatResponse: ChatResponse = await response.json();
      const { parsedReviewProperties, updatedReviewText } = chatResponse;

      setParsedReviewProperties(parsedReviewProperties);
      setReviewText(updatedReviewText);
      setChatHistory([...chatHistory, { role: 'user', message: chatInput }, { role: 'ai', message: parsedReviewProperties }]);
      setChatInput('');
      setDisplayTab(2);
    } catch (error) {
      console.error('Error during chat:', error);
    }
  };

  const handleSubmit = async () => {
    if (!parsedReviewProperties) return;
    try {
      const submitBody: any = {
        structuredReviewProperties: { restaurantName, userLocation, dateOfVisit },
        parsedReviewProperties,
        reviewText,
        sessionId,
      };

      const response = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...submitBody,
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

  const renderFormattedAIResponse = (parsedReviewProperties: ParsedReviewProperties) => {
    const placeProperties: MemoRappPlaceProperties = parsedReviewProperties.placeProperties!;
    return (
      <Box sx={{ textAlign: 'left' }}>
        <Typography><strong>Reviewer:</strong> {parsedReviewProperties.reviewer || 'Not provided'}</Typography>
        <Typography><strong>Restaurant:</strong> {restaurantName || 'Not provided'}</Typography>
        <Typography><strong>Location:</strong> {userLocation || 'Not provided'}</Typography>
        <Typography><strong>Date of Visit:</strong> {formatDateToMMDDYYYY(dateOfVisit) || 'Not provided'}</Typography>
        <Typography><strong>Overall Experience:</strong> {parsedReviewProperties.overallExperience || 'Not provided'}</Typography>
        <Typography><strong>Items Ordered:</strong></Typography>
        <ul>
          {parsedReviewProperties.itemsOrdered.map((item, idx) => (
            <li key={idx}>
              {item} - {parsedReviewProperties.ratings[idx]?.rating || 'No rating provided'}
            </li>
          ))}
        </ul>
        <Typography><strong>Retrieved Location:</strong>{placeProperties?.formatted_address}</Typography>
      </Box>
    )
  };

  return (
    <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY!} libraries={['places']}>
      <Paper style={{ padding: 20 }}>
        <Typography variant="h4" gutterBottom>
          Add a Review
        </Typography>

        <Tabs value={displayTab} onChange={handleTabChange} indicatorColor="primary" textColor="primary">
          <Tab label="Review Text" />
          <Tab label="Extracted Information" />
          <Tab label="Chat History" />
        </Tabs>

        <Box mt={2}>
          {displayTab === AddReviewDisplayTabs.ReviewText && (
            <Box>
              <Autocomplete
                onLoad={(autocomplete) => (autocompleteRef.current = autocomplete)}
                onPlaceChanged={handlePlaceChanged}
              >
                <TextField
                  fullWidth
                  label="Restaurant Name"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  placeholder="Enter the restaurant name"
                  required
                  style={{ marginBottom: 20 }}
                />
              </Autocomplete>
              <TextField
                fullWidth
                label="Location"
                slotProps={{
                  input: {
                    readOnly: true,
                  },
                }}
                value={userLocation}
                onChange={(e) => setUserLocation(e.target.value)}
                placeholder="Enter the location (e.g., City or Address)"
                style={{ marginBottom: 20 }}
              />
              <TextField
                fullWidth
                type="date"
                value={dateOfVisit}
                onChange={(e) => setDateOfVisit(e.target.value)}
                placeholder="mm/dd/yyyy"
                label="Date of Visit"
              />
              <TextField
                style={{ marginTop: 20 }}
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
          {displayTab === AddReviewDisplayTabs.ExtractedInformation && parsedReviewProperties && renderFormattedAIResponse(parsedReviewProperties)}
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
              disabled={!parsedReviewProperties}
            >
              Submit
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </LoadScript>
  );
};

export default AddReview;

