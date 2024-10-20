// import express, {  RequestHandler } from 'express';
import path from 'path';
// import cors from 'cors';
import * as dotenv from 'dotenv';
import OpenAI from 'openai';
import mongoose from 'mongoose';
import Review from './models/Review';
const cors: any = require('cors');
const express: any = require('express');

dotenv.config();

console.log('environment variables:');
console.log(process.env.OPENAI_API_KEY);
console.log(process.env.MONGODB_URI);
console.log(process.env.PORT);

const app = express();

app.use(cors());
app.use(express.json());

// Get all reviews or filter by query parameters
const reviewsRouter = async (req: any, res: any) => {
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
};

// Define your API routes first
app.use('/api/reviews', reviewsRouter);  // Your reviews router

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

const freeFormReviewHandler: any = async (req: any, res: any): Promise<void> => {
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

const structuredReviewHandler: any = async (req: any, res: any): Promise<void> => {
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

const openai = new OpenAI({
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