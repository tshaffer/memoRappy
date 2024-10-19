import express, { Request, Response, RequestHandler } from 'express';
import path from 'path';
import cors from 'cors';
import * as dotenv from 'dotenv';
import OpenAI from 'openai';
import mongoose from 'mongoose';
import Review from './models/Review';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '../frontend/build')));

// Serve the frontend app for all other routes
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || '')
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('Error connecting to MongoDB:', error));

// Get all reviews or filter by query parameters
app.get('/api/reviews', async (req: Request, res: Response) => {
  try {
    const { restaurant, location, startDate, endDate, item } = req.query;

    // Build a dynamic query based on the provided filters
    const query: any = {};

    if (restaurant) {
      query.restaurant = new RegExp(restaurant as string, 'i'); // Case-insensitive search
    }

    if (location) {
      query.location = new RegExp(location as string, 'i'); // Case-insensitive search
    }

    // Use the raw ISO date strings for date filtering
    if (startDate && endDate) {
      query.dateOfVisit = {
        $gte: startDate as string,
        $lte: endDate as string,
      };
    } else if (startDate) {
      query.dateOfVisit = { $gte: startDate as string };
    }

    if (item) {
      query.itemsOrdered = { $in: [new RegExp(item as string, 'i')] }; // Find if item exists in the list
    }

    // Query the MongoDB database for matching reviews
    const reviews = await Review.find(query).exec();
    res.status(200).json({ reviews });
  } catch (error) {
    console.error('Error retrieving reviews:', error);
    res.status(500).json({ error: 'An error occurred while retrieving the reviews.' });
  }
});

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
    - Date of visit (in the format YYYY-MM-DD)
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

    const messageContent = response.choices[0].message?.content;
    if (!messageContent) {
      res.status(500).json({ error: 'Failed to extract data from the response.' });
      return;
    }

    console.log('OpenAI response:', messageContent);

    // Extract the date of visit
    const extractedDateOfVisit = extractFieldFromResponse(messageContent, 'Date of visit');

    // Clean and format the extracted date
    let formattedDateOfVisit = '';
    try {
      const cleanedDate = cleanDateString(extractedDateOfVisit);  // Clean the date string
      const parsedDate = new Date(cleanedDate);
      if (!isNaN(parsedDate.getTime())) {
        formattedDateOfVisit = parsedDate.toISOString();  // Convert to ISO format
      } else {
        throw new Error('Invalid Date');
      }
    } catch (error) {
      console.error('Error parsing date:', extractedDateOfVisit);
      formattedDateOfVisit = extractedDateOfVisit; // Fall back to the extracted string if parsing fails
    }

    // Manually extract and transform the rest of the data
    const extractedData = {
      reviewer: "Ted",
      restaurant: extractFieldFromResponse(messageContent, 'Restaurant name'),
      location: extractFieldFromResponse(messageContent, 'Location'),
      dateOfVisit: formattedDateOfVisit,
      itemsOrdered: extractListFromResponse(messageContent, 'List of items ordered'),
      overallExperience: extractFieldFromResponse(messageContent, 'Overall experience'),
      ratings: extractListFromResponse(messageContent, 'Ratings for each item').map((ratingString: string) => {
        const parts = ratingString.match(/(.+?)\s?\((.+?)\)/);
        return {
          item: parts ? parts[1].trim() : ratingString,
          rating: parts ? parts[2].trim() : '',
        };
      }),
    };

    console.log('Extracted data:', extractedData);

    if (!extractedData.restaurant || !extractedData.dateOfVisit) {
      res.status(400).json({ error: 'Restaurant name and date of visit are required.' });
      return;
    }

    const newReview = new Review(extractedData);
    await newReview.save();

    res.status(201).json({ message: 'Review saved successfully!', review: newReview });
  } catch (error) {
    console.error('Error processing free-form review:', error);
    res.status(500).json({ error: 'An error occurred while processing the review.' });
  }
};

// Helper function to clean the date string and add the current year if missing
// TEDTODO - may no longer be needed given the changes to the OpenAI prompt 
const cleanDateString = (dateStr: string): string => {

  console.log('cleanDateString:');
  console.log(dateStr);

  const currentYear = new Date().getFullYear();

  // Remove ordinal suffixes like "st", "nd", "rd", "th"
  let cleanedDate = dateStr.replace(/(\d+)(st|nd|rd|th)/, '$1').trim();

  // Check if the year is missing by seeing if the string contains a 4-digit number (year)
  const yearRegex = /\b\d{4}\b/;
  if (!yearRegex.test(cleanedDate)) {
    // Append the current year if it's missing
    cleanedDate += ` ${currentYear}`;
  }

  console.log(cleanedDate);

  return cleanedDate;
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

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});