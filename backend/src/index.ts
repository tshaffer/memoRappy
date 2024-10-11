import express, { Request, Response } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv'; // Load environment variables
import OpenAI from 'openai';
import mongoose from 'mongoose';
import Review from './models/Review';

dotenv.config();

// Connect to MongoDB
console.log('Connecting to MongoDB...');
console.log('MONGODB_URI:', process.env.MONGODB_URI);
mongoose.connect(process.env.MONGODB_URI || '')
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('Error connecting to MongoDB:', error));


const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Initialize OpenAI client with API key from environment variable
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// POST route to add a new review
app.post('/api/reviews', async (req: Request, res: Response) => {
  try {
    const review = new Review(req.body);
    await review.save();
    res.status(201).json(review);
  } catch (error) {
    console.error('Error saving review:', error);
    res.status(500).json({ error: 'An error occurred while saving the review.' });
  }
});

// GET route to fetch all reviews
app.get('/api/reviews', async (req: Request, res: Response) => {
  try {
    const reviews = await Review.find();
    res.status(200).json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'An error occurred while fetching reviews.' });
  }
});

// POST route to handle queries to OpenAI
app.post('/api/query', async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body; // Get the query from the request body
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Use the new model
      messages: [{ role: "user", content: prompt }],
      max_tokens: 100,
      temperature: 0.7,
    });

    res.json({ result: response.choices[0].message.content }); // Send back the result
  } catch (error) {
    console.error('Error querying OpenAI:', error);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
