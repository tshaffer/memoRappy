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

// Extract a field from the response based on a keyword
const extractFieldFromResponse = (response: string, fieldName: string): string => {
  const regex = new RegExp(`${fieldName}:\\s*(.*)`, 'i');
  const match = response.match(regex);
  return match ? match[1].trim() : '';
};

// Extract a list of items from the response based on a keyword
const extractListFromResponse = (response: string, fieldName: string): string[] => {
  const regex = new RegExp(`${fieldName}:\\s*(.*)`, 'i');
  const match = response.match(regex);
  return match ? match[1].split(',').map(item => item.trim()) : [];
};

const freeFormReviewHandler: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  console.log('freeFormReviewHandler');

  try {
    const { reviewText } = req.body;

    console.log('reviewText:', reviewText);

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

    console.log('OpenAI response:', messageContent);

    // Manually extract and transform the data
    const extractedData = {
      reviewer: "Ted", // Extract from the response if necessary
      restaurant: extractFieldFromResponse(messageContent, 'Restaurant name'),
      location: extractFieldFromResponse(messageContent, 'Location'),
      dateOfVisit: extractFieldFromResponse(messageContent, 'Date of visit'),
      itemsOrdered: extractListFromResponse(messageContent, 'List of items ordered'),
      overallExperience: extractFieldFromResponse(messageContent, 'Overall experience'),

      // Transform ratings from a string to an object with item and rating fields
      ratings: extractListFromResponse(messageContent, 'Ratings for each item').map((ratingString: string) => {
        const parts = ratingString.match(/(.+?)\s?\((.+?)\)/);
        return {
          item: parts ? parts[1].trim() : ratingString,
          rating: parts ? parts[2].trim() : '',
        };
      }),
    };

    console.log('Extracted data:', extractedData);

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

const structuredReviewHandler: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const reviewData = req.body;

    // Basic validation: check if the restaurant name and date of visit are provided
    if (!reviewData.restaurant || !reviewData.dateOfVisit) {
      res.status(400).json({ error: 'Restaurant name and date of visit are required.' });
      return;
    }

    // Save the structured review data to MongoDB
    const newReview = new Review(reviewData);
    await newReview.save();

    res.status(201).json({ message: 'Review saved successfully!', review: newReview });
  } catch (error) {
    console.error('Error saving structured review:', error);
    res.status(500).json({ error: 'An error occurred while saving the review.' });
  }
}

app.post('/api/reviews', structuredReviewHandler);
app.post('/api/reviews/free-form', freeFormReviewHandler);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});