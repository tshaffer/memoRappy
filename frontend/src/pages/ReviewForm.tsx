import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useParams } from 'react-router-dom';
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
  FormControl,
  FormControlLabel,
  FormLabel,
  RadioGroup,
  Radio,
  CircularProgress,
} from '@mui/material';
import { LoadScript, Autocomplete, Libraries } from '@react-google-maps/api';
import { ReviewFormDisplayTabs, ChatResponse, GooglePlace, FreeformReviewProperties, PreviewRequestBody, ReviewEntity, SubmitReviewBody, StructuredReviewProperties, MemoRappReview, EditableReview, PreviewResponse } from '../types';
import { pickGooglePlaceProperties } from '../utilities';

interface LocationState {
  editableReview: EditableReview;
}

type ChatMessage = {
  role: 'user' | 'ai';
  message: string | FreeformReviewProperties;
};

const libraries = ['places'] as Libraries;

const ReviewForm: React.FC = () => {

  const { _id } = useParams<{ _id: string }>();

  const location = useLocation();
  const editableReview = location.state as EditableReview | null;

  let place: GooglePlace | null = null;
  let review: MemoRappReview | null = null;
  if (editableReview) {
    place = editableReview.place;
    review = editableReview.review;
  }

  const generateSessionId = (): string => Math.random().toString(36).substring(2) + Date.now().toString(36);

  const formatDateToMMDDYYYY = (dateString: string): string => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${month}/${day}/${year}`;
  };

  const getFormattedDate = (): string => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const year = today.getFullYear();
    return `${year}-${month}-${day}`;
  };

  const [isLoading, setIsLoading] = useState(false);

  const [googlePlace, setGooglePlace] = useState<GooglePlace | null>(null);
  const [restaurantLabel, setRestaurantLabel] = useState('');
  const [dateOfVisit, setDateOfVisit] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [wouldReturn, setWouldReturn] = useState<boolean | null>(null); // New state
  const [freeformReviewProperties, setFreeformReviewProperties] = useState<FreeformReviewProperties | null>(null);
  const [displayTab, setDisplayTab] = useState(ReviewFormDisplayTabs.ReviewText);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    setDateOfVisit(getFormattedDate());
    if (!sessionId) {
      setSessionId(generateSessionId());
    }
  }, [sessionId]);

  useEffect(() => {
    if (place && review) {
      setGooglePlace(place);
      setRestaurantLabel(place.name);
      setDateOfVisit(review.structuredReviewProperties.dateOfVisit);
      setReviewText(review.freeformReviewProperties.reviewText);
      setWouldReturn(review.structuredReviewProperties.wouldReturn);
      setFreeformReviewProperties({
        itemReviews: review.freeformReviewProperties.itemReviews,
        reviewer: review.freeformReviewProperties.reviewer,
        reviewText: review.freeformReviewProperties.reviewText
      });
    }
  }, [place, review]);


  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setDisplayTab(newValue);
  };

  const handlePlaceChanged = () => {
    if (autocompleteRef.current) {
      const place: google.maps.places.PlaceResult = autocompleteRef.current.getPlace();
      const geometry: google.maps.places.PlaceGeometry = place.geometry!;

      console.log('handlePlaceChanged');
      console.log('place', place);
      console.log('geometry', geometry);
      console.log('geometry.location');
      console.log(geometry.location!);
      console.log('geometry.viewport');
      console.log(geometry.viewport);

      console.log(geometry.location!.lat());
      console.log(geometry.location!.lng());
      console.log(geometry.viewport!.getNorthEast().lat());
      console.log(geometry.viewport!.getNorthEast().lng());
      console.log(geometry.viewport!.getSouthWest().lat());
      console.log(geometry.viewport!.getSouthWest().lng());

      // setPlaceResult(place);
      const googlePlace: GooglePlace = pickGooglePlaceProperties(place);
      setGooglePlace(googlePlace);

      const restaurantLabel = googlePlace.name;
      setRestaurantLabel(restaurantLabel);
    }
  };

  const handleWouldReturnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value === "yes" ? true : event.target.value === "no" ? false : null;
    setWouldReturn(value);
  };

  const handlePreview = async () => {
    if (!sessionId) return;
    try {
      setIsLoading(true);
      const previewBody: PreviewRequestBody = {
        reviewText,
        sessionId,
      };
      const response = await fetch('/api/reviews/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(previewBody),
      });
      const data: PreviewResponse = await response.json();
      setFreeformReviewProperties(data.freeformReviewProperties);
      setChatHistory([...chatHistory, { role: 'user', message: reviewText }, { role: 'ai', message: data.freeformReviewProperties }]);
      setDisplayTab(1);
    } catch (error) {
      console.error('Error previewing review:', error);
    }
    setIsLoading(false);
  };

  const handleChat = async () => {
    if (!sessionId || !chatInput) return;
    try {
      setIsLoading(true);
      const response: Response = await fetch('/api/reviews/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput: chatInput, sessionId, reviewText }),
      });
      const chatResponse: ChatResponse = (await response.json()) as ChatResponse;
      const { freeformReviewProperties, updatedReviewText } = chatResponse;

      setFreeformReviewProperties(freeformReviewProperties);
      setReviewText(updatedReviewText);
      setChatHistory([...chatHistory, { role: 'user', message: chatInput }, { role: 'ai', message: freeformReviewProperties }]);
      setChatInput('');
      setDisplayTab(2);
    } catch (error) {
      console.error('Error during chat:', error);
    }
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    if (!freeformReviewProperties) return;
    try {
      setIsLoading(true);

      console.log('googlePlace', googlePlace);
      console.log('freeformReviewProperties', freeformReviewProperties);
      console.log('wouldReturn', wouldReturn);
      console.log('sessionId', sessionId);
      console.log('reviewText', reviewText);
      const structuredReviewProperties: StructuredReviewProperties = { dateOfVisit, wouldReturn };
      console.log('structuredReviewProperties:', structuredReviewProperties);

      const submitBody: SubmitReviewBody = {
        _id,
        place: googlePlace!,
        structuredReviewProperties,
        freeformReviewProperties,
        reviewText,
        sessionId: sessionId!,
      };
      console.log('submitBody:', submitBody);

      const response = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...submitBody,
        }),
      });
      const data = await response.json();
      console.log('Review submitted:', data);
    } catch (error) {
      console.error('Error submitting review:', error);
    }
    setIsLoading(false);
  };

  const renderPreviewResponse = (freeformReviewProperties: FreeformReviewProperties): JSX.Element => {
    const place: GooglePlace = googlePlace!;
    const getReturnString = () => {
      if (wouldReturn === true) return 'Yes';
      if (wouldReturn === false) return 'No';
      return 'Not specified';
    }
    return (
      <Box sx={{ textAlign: 'left' }}>
        <Typography><strong>Restaurant:</strong> {place.name || 'Not provided'}</Typography>
        <Typography><strong>Date of Visit:</strong> {formatDateToMMDDYYYY(dateOfVisit) || 'Not provided'}</Typography>
        <Typography><strong>Would Return:</strong> {getReturnString()}</Typography>
        <Typography><strong>Items Ordered:</strong></Typography>
        <ul>
          {freeformReviewProperties.itemReviews.map((itemReview, idx) => (
            <li key={idx}>
              {itemReview.item} - {itemReview.review || 'No rating provided'}
            </li>
          ))}
        </ul>
        <Typography><strong>Retrieved Location:</strong>{place?.formatted_address}</Typography>
        <Typography><strong>Reviewer:</strong> {freeformReviewProperties.reviewer || 'Not provided'}</Typography>
      </Box>
    )
  };

  return (
    <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY!} libraries={libraries}>
      <Paper style={{ padding: 20 }}>
        {isLoading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              zIndex: 1,
            }}
          >
            <CircularProgress />
          </Box>
        )}
        <Typography variant="h4" gutterBottom>
          Add a Review
        </Typography>

        <Tabs value={displayTab} onChange={handleTabChange} indicatorColor="primary" textColor="primary">
          <Tab label="Review Text" />
          <Tab label="Extracted Information" />
          <Tab label="Chat History" />
        </Tabs>

        <Box mt={2}>
          {displayTab === ReviewFormDisplayTabs.ReviewText && (
            <Box>
              <Autocomplete
                onLoad={(autocomplete) => (autocompleteRef.current = autocomplete)}
                onPlaceChanged={handlePlaceChanged}
              >
                <TextField
                  fullWidth
                  label="Restaurant Name"
                  value={restaurantLabel}
                  onChange={(e) => setRestaurantLabel(e.target.value)}
                  placeholder="Enter the restaurant name"
                  required
                  style={{ marginBottom: 20 }}
                />
              </Autocomplete>
              <TextField
                fullWidth
                type="date"
                value={dateOfVisit}
                onChange={(e) => setDateOfVisit(e.target.value)}
                placeholder="mm/dd/yyyy"
                label="Date of Visit"
              />
              <FormControl component="fieldset" style={{ marginTop: 20, width: '100%' }}>
                <FormLabel component="legend">Would Return</FormLabel>
                <Box display="flex" alignItems="center">
                  <RadioGroup
                    row
                    aria-label="would-return"
                    name="would-return"
                    value={wouldReturn === true ? 'yes' : wouldReturn === false ? 'no' : ''}
                    onChange={handleWouldReturnChange}
                  >
                    <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                    <FormControlLabel value="no" control={<Radio />} label="No" />
                  </RadioGroup>
                  <Button onClick={() => setWouldReturn(null)} style={{ marginLeft: 10 }}>
                    Clear
                  </Button>
                </Box>
              </FormControl>
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
          {displayTab === ReviewFormDisplayTabs.ExtractedInformation && freeformReviewProperties && renderPreviewResponse(freeformReviewProperties)}
          {displayTab === ReviewFormDisplayTabs.ChatHistory && (
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
                      renderPreviewResponse(msg.message as ReviewEntity)
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
              disabled={!googlePlace || !reviewText}
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
              disabled={!freeformReviewProperties}
            >
              Submit
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </LoadScript>
  );
};

export default ReviewForm;
