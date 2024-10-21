import React, { useState, useEffect } from 'react';
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
  const [interimText, setInterimText] = useState('');
  const [reviewer, setReviewer] = useState('Ted'); // Prefill reviewer for now
  const [restaurant, setRestaurant] = useState('');
  const [location, setLocation] = useState('');
  const [dateOfVisit, setDateOfVisit] = useState('');
  const [itemsOrdered, setItemsOrdered] = useState<string[]>(['']);
  const [ratings, setRatings] = useState<string[]>(['']);
  const [overallExperience, setOverallExperience] = useState('');

  const [recognitionActive, setRecognitionActive] = useState(false);
  const [recognizer, setRecognizer] = useState<SpeechRecognition | null>(null);

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();

      recognitionInstance.continuous = true; // Keep recognition running
      recognitionInstance.interimResults = true; // Process interim results

      recognitionInstance.onresult = (event: any) => {
        console.log('Speech recognition event:', event);
        console.log('Current reviewText:', reviewText);

        let finalTranscript = reviewText;

        // Iterate through results and append text
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          console.log('Transcript:', transcript);
          console.log('isFinal:', event.results[i].isFinal);

          if (event.results[i].isFinal) {
            finalTranscript += transcript;
            console.log('Updated finalTranscript:', finalTranscript);
          } else {
            setInterimText(transcript);
          }
        }

        setReviewText(finalTranscript);
        setInterimText(''); // Clear interim text after final result
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event);
      };

      setRecognizer(recognitionInstance);
    } else {
      console.error('SpeechRecognition API is not supported in this browser.');
    }
  }, [reviewText]);

  const handleStartListening = () => {
    if (recognizer && !recognitionActive) {
      console.log('Starting speech recognition...');
      recognizer.start();
      setRecognitionActive(true);
      console.log('Speech recognition started...');
    }
  };

  const handleStopListening = () => {
    console.log('Stopping speech recognition...');

    if (recognizer && recognitionActive) {
      recognizer.stop();
      recognizer.onresult = null; // Remove event listeners
      recognizer.onerror = null;
      recognizer.onend = null;

      setRecognitionActive(false);
      console.log('Speech recognition stopped.');
    }
  };

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
        const response = await fetch('/api/reviews/free-form', {
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
        const response = await fetch('/api/reviews', {
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
              <Typography variant="body1" color="textSecondary">
                {interimText && `Listening: ${interimText}`}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Button variant="contained" color="primary" onClick={handleStartListening} fullWidth>
                Start Listening
              </Button>
              <Button variant="contained" color="secondary" onClick={handleStopListening} fullWidth>
                Stop Listening
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Button type="submit" variant="contained" color="primary" fullWidth>
                Submit Review
              </Button>
            </Grid>
          </Grid>
        ) : (
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Reviewer"
                value={reviewer}
                onChange={(e) => setReviewer(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Restaurant Name"
                value={restaurant}
                onChange={(e) => setRestaurant(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
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
                <Grid item xs={12} sm={5}>
                  <TextField
                    fullWidth
                    label={`Item ${index + 1}`}
                    value={item}
                    onChange={(e) => handleItemChange(index, e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={5}>
                  <TextField
                    fullWidth
                    label={`Rating for Item ${index + 1}`}
                    value={ratings[index]}
                    onChange={(e) => handleRatingChange(index, e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={2} style={{ display: 'flex', alignItems: 'center' }}>
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
                fullWidth
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
