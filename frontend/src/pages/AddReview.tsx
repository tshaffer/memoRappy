import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Typography,
  Paper,
  Grid,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';

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
  const [recognitionActive, setRecognitionActive] = useState(false);
  const [recognizer, setRecognizer] = useState<any | null>(null); // SpeechRecognition object

  // Toggle free-form or structured input
  const handleInputModeChange = (event: React.MouseEvent<HTMLElement>, newMode: string) => {
    if (newMode) {
      setInputMode(newMode);
    }
  };

  // Handle voice input toggle
  const handleVoiceInputToggle = () => {
    if (recognitionActive && recognizer) {
      recognizer.stop();
      setRecognitionActive(false);
    } else {
      if (recognizer) {
        recognizer.start();
        setRecognitionActive(true);
      }
    }
  };

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true; // Keep listening until manually stopped
      recognition.interimResults = true; // Show partial results

      recognition.onresult = (event: any) => {
        
        let interimTranscript = '';
        let finalTranscript = reviewText;

        console.log('Speech recognition event:', event);
        console.log('finalTranscript:', finalTranscript);
        console.log('index:', event.resultIndex);
        console.log('results:', event.results);

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          console.log('Transcript:', transcript);
          console.log('isFinal:', event.results[i].isFinal);
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // Append new text to the existing reviewText
        setReviewText(finalTranscript + interimTranscript);
      };

      recognition.onend = () => {
        if (recognitionActive) {
          recognition.start(); // Restart recognition if voice input mode is still active
        }
      };

      setRecognizer(recognition);
    }
  }, [reviewText, recognitionActive]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      {inputMode === 'free-form' && (
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
              onClick={handleVoiceInputToggle}
              startIcon={<MicIcon />}
              fullWidth
            >
              {recognitionActive ? 'Stop Listening' : 'Speak Your Review'}
            </Button>
          </Grid>
          <Grid item xs={12}>
            <Button type="submit" variant="contained" color="primary" fullWidth onClick={handleSubmit}>
              Submit Review
            </Button>
          </Grid>
        </Grid>
      )}
    </Paper>
  );
};

export default AddReview;
