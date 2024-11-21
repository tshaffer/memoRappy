import path from 'path';
import cors from 'cors';
import * as dotenv from 'dotenv';
import OpenAI from 'openai';
import mongoose from 'mongoose';
import express from 'express';

import { addReviewsFromFileHandler, chatReviewHandler, checkTextSimilarityHandler, filterReviewsHandler, getPlaces, getReviews, getStandardizedNames, previewReviewHandler, submitReviewHandler } from './controllers';
import { naturalLanguageQueryHandler } from './controllers/naturalLanguageQuery';

export let openai: OpenAI;

dotenv.config();

console.log('environment variables:');
console.log(process.env.OPENAI_API_KEY);
console.log(process.env.MONGODB_URI);
console.log(process.env.PORT);

const app: express.Application = express();

app.use(cors());
app.use(express.json());

// routes
app.get('/api/places', getPlaces);
app.get('/api/reviews', getReviews);
app.get('/api/standardizedNames', getStandardizedNames);
app.post('/api/reviews/preview', previewReviewHandler);
app.post('/api/reviews/chat', chatReviewHandler);
app.post('/api/reviews/submit', submitReviewHandler);
app.post('/api/reviews/naturalLanguageQuery', naturalLanguageQueryHandler);
app.post('/api/reviews/filterReviews', filterReviewsHandler);
app.post('/api/reviews/addReviewsFromFile', addReviewsFromFileHandler);
app.post('/api/checkTextSimilarity', checkTextSimilarityHandler);

// Serve static files from the frontend build directory, adjusted for production
const frontendPath = process.env.NODE_ENV === 'production'
  ? path.join(__dirname, '../../frontend/build') // Adjusted for Heroku
  : path.join(__dirname, '../frontend/build');   // Works for local development

console.log('frontend build directory:', frontendPath);

// Serve static files from the adjusted path
app.use(express.static(frontendPath));

// All other requests to serve index.html
app.get('*', (req: any, res: any) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || '')
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('Error connecting to MongoDB:', error));

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});