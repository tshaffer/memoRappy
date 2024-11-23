import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { IconButton, Tooltip, useMediaQuery } from '@mui/material';
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
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';

import { LoadScript, Autocomplete, Libraries } from '@react-google-maps/api';
import { ReviewFormDisplayTabs, ChatResponse, GooglePlace, FreeformReviewProperties, PreviewRequestBody, ReviewEntity, SubmitReviewBody, StructuredReviewProperties, MemoRappReview, EditableReview, PreviewResponse, ChatRequestBody } from '../types';
import { pickGooglePlaceProperties } from '../utilities';

// Manually define SpeechRecognition and webkitSpeechRecognition types
declare global {
  interface Window {
    // SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

type ChatMessage = {
  role: 'user' | 'ai';
  message: string | FreeformReviewProperties;
};

const libraries = ['places'] as Libraries;

const ReviewForm: React.FC = () => {

  const { _id } = useParams<{ _id: string }>();

  const isMobile = useMediaQuery('(max-width:768px)');

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
  const restaurantNameRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const placesServiceContainerRef = useRef<HTMLDivElement | null>(null);

  let recognitionActive: React.MutableRefObject<boolean> = useRef(false);
  const [listening, setListening] = useState(false);
  const [recognizer, setRecognizer] = useState<SpeechRecognition | null>(null);

  const [currentField, setCurrentField] = useState<string>('restaurantName');
  // let currentField = 'restaurantName';
  // const setCurrentField = (field: string) => {
  //   currentField = field;
  // }

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

  // Map spoken words to punctuation
  const processPunctuation = (text: string) => {
    return text
      .replace(/\bcomma\b/gi, ',')
      .replace(/\bperiod\b/gi, '.')
      .replace(/\bquestion mark\b/gi, '?')
      .replace(/\bexclamation mark\b/gi, '!');
  };

  // Handle voice input toggle
  const handleVoiceInputToggle = () => {
    if (recognitionActive.current && recognizer) {
      recognizer.stop();
      recognitionActive.current = false;
      setListening(false);
    } else {
      if (recognizer) {
        recognizer.start();
        recognitionActive.current = true;
        setListening(true);
      }
    }
  };

  const xnavigateToNextField = useCallback(() => {
    const fields = ['restaurantName', 'dateOfVisit', 'wouldReturn', 'reviewText'];
    const currentIndex = fields.indexOf(currentField);
    const nextIndex = (currentIndex + 1) % fields.length;
    setCurrentField(fields[nextIndex]);

  }, [currentField]);

  const navigateToNextField = useCallback(() => {
    // const fields = ['restaurantName', 'dateOfVisit', 'wouldReturn', 'reviewText'];
    // setCurrentField((prevField) => {
    //   const currentIndex = fields.indexOf(prevField);
    //   const nextIndex = (currentIndex + 1) % fields.length;
    //   return fields[nextIndex];
    // });
    console.log('Current Field Before Update:', currentField);
    setCurrentField((prevField) => {
      const fields = ['restaurantName', 'dateOfVisit', 'wouldReturn', 'reviewText'];
      const currentIndex = fields.indexOf(prevField);
      const nextIndex = (currentIndex + 1) % fields.length;
      const nextField = fields[nextIndex];
      console.log('Current Field After Update:', nextField);
      return nextField;
    });

  }, []);

  const navigateToPreviousField = useCallback(() => {
    const fields = ['restaurantName', 'dateOfVisit', 'wouldReturn', 'reviewText'];
    const currentIndex = fields.indexOf(currentField);
    const prevIndex = (currentIndex - 1 + fields.length) % fields.length;
    setCurrentField(fields[prevIndex]);
  }, [currentField]);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true; // Keep listening until manually stopped
      recognition.interimResults = true; // Show partial results

      recognition.onresult = (event: any) => {
        if (recognitionActive) {

          let voiceInput = '';
          let processResults: boolean = false;

          for (let i = event.resultIndex; i < event.results.length; i++) {
            voiceInput = event.results[i][0].transcript;
            voiceInput = processPunctuation(voiceInput); // Process punctuation
            if (event.results[i].isFinal) {
              processResults = true;
              break;
            }
          }

          if (processResults) {
            console.log('processResults:', voiceInput);
            console.log('currentField: ', currentField);
            if (voiceInput.includes('next field')) {
              navigateToNextField();
            } else if (voiceInput.includes('previous field')) {
              navigateToPreviousField();
            } else if (currentField === 'restaurantName') {
              setRestaurantLabel((prev) => {
                const updatedLabel = prev + ' ' + voiceInput;

                console.log('setRestaurantLabel:', updatedLabel);
                console.log('restaurantNameRef.current:', restaurantNameRef.current);
                console.log('autocompleteRef.current:', autocompleteRef.current);

                // Programmatically trigger Google Places search
                if (restaurantNameRef.current) {
                  const autocompleteService = new google.maps.places.AutocompleteService();
                  autocompleteService.getPlacePredictions(
                    { input: updatedLabel },
                    (predictions, status) => {
                      if (status === google.maps.places.PlacesServiceStatus.OK && predictions?.length) {

                        console.log('Predictions:', predictions);

                        // Use the first prediction for this example
                        const firstPrediction = predictions[0];
                        if (restaurantNameRef.current) {
                          if (placesServiceContainerRef.current) {
                            const placesService = new google.maps.places.PlacesService(placesServiceContainerRef.current);
                            placesService.getDetails({ placeId: firstPrediction.place_id }, (place, status) => {
                              if (status === google.maps.places.PlacesServiceStatus.OK && place) {
                                console.log('Place details:', place);
                                const googlePlace: GooglePlace = pickGooglePlaceProperties(place);
                                setGooglePlace(googlePlace);
                                setRestaurantLabel(googlePlace.name || updatedLabel);
                              }
                            });
                          }
                        } else {
                          console.error('restaurantNameRef.current is null.');
                        }
                      }
                    }
                  );
                }

                console.log('updatedLabel:', updatedLabel);
                return updatedLabel;
              });

            } else if (currentField === 'dateOfVisit') {
              setDateOfVisit(voiceInput);
            } else if (currentField === 'wouldReturn') {
              if (voiceInput.includes('yes')) {
                setWouldReturn(true);
              } else if (voiceInput.includes('no')) {
                setWouldReturn(false);
              }
            } else if (currentField === 'reviewText') {
              setReviewText((prevReviewText) => {
                let finalTranscript = prevReviewText;
                // Iterate through the results and append final and interim results
                for (let i = event.resultIndex; i < event.results.length; i++) {
                  let transcript = event.results[i][0].transcript;
                  transcript = processPunctuation(transcript); // Process punctuation
                  if (event.results[i].isFinal) {
                    finalTranscript += transcript; // Append final results to existing text
                  }
                }
                return finalTranscript; // Return updated final transcript
              });
            }
          }
        }
      };

      recognition.onend = () => {
        if (recognitionActive.current) {
          recognition.start(); // Restart recognition if voice input mode is still active
        }
      };

      setRecognizer(recognition);
    }
  }, [navigateToNextField, navigateToPreviousField]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setDisplayTab(newValue);
  };

  const handlePlaceChanged = () => {
    console.log('handlePlaceChanged');
    if (autocompleteRef.current) {
      console.log('autocompleteRef.current:', autocompleteRef.current);
      const place: google.maps.places.PlaceResult = autocompleteRef.current.getPlace();
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
      const chatRequestBody: ChatRequestBody = {
        userInput: chatInput,
        sessionId,
        reviewText,
      };
      const response: Response = await fetch('/api/reviews/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chatRequestBody),
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
      const structuredReviewProperties: StructuredReviewProperties = { dateOfVisit, wouldReturn };
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

  // const isFocused = (fieldName: string) => currentField === fieldName;

  return (
    <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY!} libraries={libraries}>
      <div ref={placesServiceContainerRef} style={{ display: 'none' }}></div>
      <Paper
        style={{
          padding: isMobile ? '16px' : '24px',
          marginBottom: isMobile ? '56px' : '0', // Space for fixed buttons on mobile
          minHeight: '100vh',
        }}
      >
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
          {isMobile ? 'Add/Edit Review' : 'Add a Review'}
        </Typography>

        <Tabs
          value={displayTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant={isMobile ? 'scrollable' : 'standard'}
        >
          <Tab label="Review" />
          <Tab label="Info" />
          <Tab label="Chat" />
        </Tabs>

        <Box
          mt={2}
          sx={{
            overflowY: 'auto',
            maxHeight: isMobile ? 'calc(100vh - 160px)' : 'auto', // Adjust for mobile view
          }}
        >
          {displayTab === ReviewFormDisplayTabs.ReviewText && (
            <Box>
              <Tooltip title={listening ? 'Stop Listening' : 'Speak Your Review'}>
                <IconButton
                  color={listening ? 'secondary' : 'primary'}
                  onClick={handleVoiceInputToggle}
                  size="small"
                  aria-label={listening ? 'Stop Listening' : 'Speak Your Review'}
                >
                  {listening ? <MicOffIcon /> : <MicIcon />}
                </IconButton>
              </Tooltip>
              <Box
                style={{
                  marginBottom: 20,
                  // border: isFocused('restaurantName') ? '2px solid blue' : '1px solid red',
                  // borderRadius: 4,
                  // padding: '4px', // Optional for spacing
                }}
              >
                <Autocomplete
                  onLoad={(autocomplete) => (autocompleteRef.current = autocomplete)}
                  onPlaceChanged={handlePlaceChanged}
                >
                  <TextField
                    fullWidth
                    label="Restaurant Name"
                    inputRef={restaurantNameRef}
                    value={restaurantLabel}
                    onChange={(e) => setRestaurantLabel(e.target.value)}
                    placeholder="Enter the restaurant name"
                    required
                  />
                </Autocomplete>
              </Box>
              <TextField
                // style={{
                // marginBottom: 20,
                // border: isFocused('dateOfVisit') ? '2px solid blue' : '1px solid red',
                // borderRadius: 4,
                // padding: '4px', // Optional for spacing
                // }}
                fullWidth
                type="date"
                value={dateOfVisit}
                onChange={(e) => setDateOfVisit(e.target.value)}
                placeholder="mm/dd/yyyy"
                label="Date of Visit"
              />
              <FormControl component="fieldset" style={{ marginTop: 20, width: '100%' }}>
                <FormLabel component="legend">Would Return</FormLabel>
                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                  <RadioGroup
                    row
                    name="would-return"
                    value={wouldReturn === true ? 'yes' : wouldReturn === false ? 'no' : ''}
                    onChange={handleWouldReturnChange}
                  >
                    <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                    <FormControlLabel value="no" control={<Radio />} label="No" />
                  </RadioGroup>
                  <Button onClick={() => setWouldReturn(null)} size="small">
                    Clear
                  </Button>
                </Box>
              </FormControl>
              <TextField
                style={{ marginTop: 20 }}
                fullWidth
                multiline
                rows={isMobile ? 5 : 8}
                label="Write Your Review"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Describe your dining experience in detail..."
                required
              />
            </Box>
          )}
          {displayTab === ReviewFormDisplayTabs.ExtractedInformation && freeformReviewProperties && (
            renderPreviewResponse(freeformReviewProperties)
          )}
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

        {isMobile ? (
          <Box
            sx={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'space-around',
              backgroundColor: 'white',
              padding: '8px 16px',
              boxShadow: '0 -2px 6px rgba(0,0,0,0.1)',
            }}
          >
            <Button
              variant="contained"
              color="primary"
              onClick={handlePreview}
              disabled={!googlePlace || !reviewText}
              size="small"
            >
              Preview
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleChat}
              disabled={!chatInput}
              size="small"
            >
              Chat
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={!freeformReviewProperties}
              size="small"
            >
              Submit
            </Button>
          </Box>
        ) : (
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
        )}
      </Paper>
    </LoadScript >
  );
};

export default ReviewForm;
