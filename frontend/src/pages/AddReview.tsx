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
  const [recognizer, setRecognizer] = useState<SpeechRecognition | null>(null);
  const [interimText, setInterimText] = useState(''); // Hold interim results

  // Toggle free-form or structured input
  const handleInputModeChange = (event: React.MouseEvent<HTMLElement>, newMode: string) => {
    if (newMode) {
      setInputMode(newMode);
    }
  };

  // Handle voice input toggle
  const handleVoiceInputToggle = () => {
    if (recognitionActive && recognizer) {
      console.log('Stopping speech recognition...');
      recognizer.stop(); // Stop the recognition
      setRecognitionActive(false); // Deactivate recognition mode
    } else {
      if (recognizer) {
        console.log('Starting speech recognition...');
        recognizer.start(); // Start recognition
        setRecognitionActive(true); // Activate recognition mode
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

      recognition.onstart = () => {
        console.log('Speech recognition started...');
      };

      recognition.onresult = (event: any) => {
        console.log('Speech recognition event:', event);
        console.log('Current reviewText:', reviewText);

        // Use functional setReviewText to ensure it accumulates correctly
        setReviewText((prevReviewText) => {
          let finalTranscript = prevReviewText; // Use accumulated text

          // Iterate through the results and append final and interim results
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            console.log('Transcript:', transcript);
            console.log('isFinal:', event.results[i].isFinal);

            if (event.results[i].isFinal) {
              finalTranscript += transcript; // Append final results to existing text
              console.log('Updated finalTranscript:', finalTranscript);
            } else {
              setInterimText(transcript); // Set interim text separately
              console.log('Interim text:', transcript);
            }
          }

          return finalTranscript; // Return updated final transcript
        });

        setInterimText(''); // Clear interim text after final results are received
      };

      recognition.onend = () => {
        console.log('Speech recognition ended.');
        // Restart recognition only if the user hasn't explicitly stopped it
        if (recognitionActive) {
          console.log('Restarting speech recognition...');
          recognition.start();
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event);
        setRecognitionActive(false); // Deactivate on error
      };

      setRecognizer(recognition); // Set the recognizer in the state
    } else {
      console.log('SpeechRecognition API not supported.');
    }
  }, [recognitionActive]);

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
              value={reviewText + interimText} // Combine final and interim text
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
