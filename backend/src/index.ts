import express, { Request, Response, RequestHandler } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import OpenAI from 'openai';
import mongoose from 'mongoose';
import Review from './models/Review';

dotenv.config();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || '')
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('Error connecting to MongoDB:', error));

const freeFormReviewHandler: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { reviewText } = req.body;

    // Use ChatGPT to extract structured data from the free-form text
    const prompt = `Extract the following information from this review: 
      - Reviewer name
      - Restaurant name
      - Location
      - Date of visit
      - List of items ordered
      - Ratings for each item
      - Overall experience
      Review: "${reviewText}"`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.5,
    });

    // Safely access the message content and handle the case where it might be null
    const messageContent = response.choices[0].message?.content;
    if (!messageContent) {
      res.status(500).json({ error: 'Failed to extract data from the response.' });
      return; // Stop execution if the content is null
    }

    const extractedData = JSON.parse(messageContent);

    // Validate the extracted data (basic validation example)
    if (!extractedData.restaurant || !extractedData.dateOfVisit) {
      res.status(400).json({ error: 'Restaurant name and date of visit are required.' });
      return; // Explicitly return to stop execution
    }

    // Save the structured review to MongoDB
    const newReview = new Review(extractedData);
    await newReview.save();

    res.status(201).json({ message: 'Review saved successfully!', review: newReview });
  } catch (error) {
    console.error('Error processing free-form review:', error);
    res.status(500).json({ error: 'An error occurred while processing the review.' });
  }
};

app.post('/api/reviews/free-form', freeFormReviewHandler);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});