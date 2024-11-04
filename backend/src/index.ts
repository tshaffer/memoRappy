import path from 'path';
import cors from 'cors';
import * as dotenv from 'dotenv';
import OpenAI from 'openai';
import mongoose from 'mongoose';
import Review from './models/Review';
import express from 'express';

import { chatReviewHandler, previewReviewHandler, reviewsRouter, submitReviewHandler } from './controllers';

export let openai: OpenAI;

dotenv.config();

console.log('environment variables:');
console.log(process.env.OPENAI_API_KEY);
console.log(process.env.MONGODB_URI);
console.log(process.env.PORT);

const app = express();

app.use(cors());
app.use(express.json());

// Query reviews handler
const queryReviewsHandler: any = async (req: any, res: any): Promise<void> => {
  const { query } = req.body;

  try {
    // Fetch all reviews from MongoDB (or you can apply filters if necessary)
    const reviews = await Review.find().exec();

    if (!reviews.length) {
      return res.status(404).json({ message: 'No reviews found.' });
    }

    // Format the review texts to be sent to ChatGPT
    const reviewsText = reviews.map((review) => `Review: "${review.reviewText}"`).join('\n\n');

    // Formulate the ChatGPT prompt
    const prompt = `
      You are helping a user query restaurant reviews. The user has asked: "${query}".
      Here are the reviews:
      ${reviewsText}
      Based on the reviews, please provide the most relevant response to the user's query.
    `;

    // Send the query and reviews to ChatGPT
    const gptResponse = await openai.chat.completions.create({
      model: "gpt-4", // Adjust based on the version you need
      messages: [
        { role: "system", content: "You're assisting with querying restaurant reviews." },
        { role: "user", content: prompt },
      ],
    });

    // Get the result from ChatGPT
    const messageContent = gptResponse.choices[0].message?.content;
    if (!messageContent) {
      return res.status(500).json({ error: 'Failed to retrieve response from ChatGPT.' });
    }

    // Respond to the client with the ChatGPT response
    res.status(200).json({ result: messageContent });

  } catch (error) {
    console.error('Error querying reviews:', error);
    res.status(500).json({ error: 'An error occurred while querying the reviews.' });
  }
};

// Define your API routes first
app.post('/api/query', queryReviewsHandler);
app.post('/api/reviews/preview', previewReviewHandler);
app.post('/api/reviews/chat', chatReviewHandler);
app.post('/api/reviews/submit', submitReviewHandler);
app.use('/api/reviews', reviewsRouter);

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