// import express, {  RequestHandler } from 'express';
import path, { parse } from 'path';
// import cors from 'cors';
import * as dotenv from 'dotenv';
import OpenAI from 'openai';
import mongoose from 'mongoose';
import Review from './models/Review';
const cors: any = require('cors');
// const express: any = require('express');
import express, { Request, Response } from 'express';

import { previewReviewHandler, submitReviewHandler } from './controllers/addReview';
import { extractFieldFromResponse, extractListFromResponse, cleanDateString } from './utilities';

export let openai: OpenAI;

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


// POST /api/reviews/parse
const parseReviewHandler: any = async (req: any, res: any): Promise<void> => {
  const { reviewText } = req.body;

  if (!reviewText) {
    return res.status(400).json({ error: 'Review text is required.' });
  }

  try {
    const prompt = `
    Extract the following information from this review:
    - Reviewer name
    - Restaurant name
    - Location
    - Date of visit (in the format YYYY-MM-DD)
    - List of items ordered
    - Ratings for each item (with the format: "item name (rating)")
    - Overall experience
    
    Review: "${reviewText}"
    
    Please provide the response in the following format:
    
    - Reviewer name: [Reviewer Name]
    - Restaurant name: [Restaurant Name]
    - Location: [Location]
    - Date of visit: [YYYY-MM-DD]
    - List of items ordered: [Item 1, Item 2, etc.]
    - Ratings for each item: [Item 1 (Rating), Item 2 (Rating)]
    - Overall experience: [Overall Experience]
    `;
    
    // Call OpenAI API to get the structured data
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Adjust to the appropriate model
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.5,
    });

    const messageContent = response.choices[0].message?.content;
    if (!messageContent) {
      return res.status(500).json({ error: 'Failed to extract data from OpenAI response.' });
    }

    console.log('OpenAI response:', messageContent);

    // Parsing the structured response (you might want to fine-tune this based on the structure returned by OpenAI)
    const parsedData = {
      reviewer: extractFieldFromResponse(messageContent, 'Reviewer name'),
      restaurant: extractFieldFromResponse(messageContent, 'Restaurant name'),
      location: extractFieldFromResponse(messageContent, 'Location'),
      dateOfVisit: extractFieldFromResponse(messageContent, 'Date of visit'),
      itemsOrdered: extractListFromResponse(messageContent, 'List of items ordered'),
      overallExperience: extractFieldFromResponse(messageContent, 'Overall experience'),
      ratings: extractListFromResponse(messageContent, 'Ratings for each item').map((ratingString: string) => {
        const parts = ratingString.match(/(.+?)\s?\((.+?)\)/);  // Match the format "item (rating)"
        return {
          item: parts ? parts[1].trim() : ratingString,
          rating: parts ? parts[2].trim() : '',
        };
      }),
    };
    
    // Send the parsed data back to the frontend for the preview
    return res.json(parsedData);
  } catch (error) {
    console.error('Error parsing review text:', error);
    return res.status(500).json({ error: 'Failed to process the review text.' });
  }
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
      reviewer: "Ted", // Replace with extracted reviewer if available
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
      reviewText, // Add the full review text to the extracted data
    };

    console.log('Extracted data:', extractedData);

    if (!extractedData.restaurant || !extractedData.dateOfVisit) {
      res.status(400).json({ error: 'Restaurant name and date of visit are required.' });
      return;
    }

    const newReview = new Review(extractedData); // Save both structured data and reviewText
    await newReview.save();

    res.status(201).json({ message: 'Review saved successfully!', review: newReview });
  } catch (error) {
    console.error('Error processing free-form review:', error);
    res.status(500).json({ error: 'An error occurred while processing the review.' });
  }
};

const old_structuredReviewHandler: any = async (req: any, res: any): Promise<void> => {

  console.log('structuredReviewHandler');

  try {
    const reviewData = req.body;
    console.log('reviewData:', reviewData);

    // Basic validation: check if the restaurant name and date of visit are provided
    if (!reviewData.restaurant || !reviewData.dateOfVisit) {
      res.status(400).json({ error: 'Restaurant name and date of visit are required.' });
      return;
    }

    // Save the structured review data to MongoDB
    const newReview = new Review(reviewData);
    console.log('newReview:', newReview);

    await newReview.save();

    console.log('Review saved successfully!');

    res.status(201).json({ message: 'Review saved successfully!', review: newReview });
  } catch (error) {
    console.error('Error saving structured review:', error);
    res.status(500).json({ error: 'An error occurred while saving the review.' });
  }
}

const structuredReviewHandler = async (req: any, res: any): Promise<void> => {
  try {

    console.log('structuredReviewHandler');
    console.log(req.body);

    const { fullReviewText, ...structuredData } = req.body;

    console.log('fullReviewText:', fullReviewText);
    console.log('structuredData:', structuredData);

    // Add the full review text to the structured data
    const newReview = new Review({
      ...structuredData,
      reviewText: fullReviewText,
    });

    console.log('newReview:', newReview);

    // await newReview.save();
    res.status(201).json({ message: 'Review saved successfully!', review: newReview });
  } catch (error) {
    console.error('Error saving structured review:', error);
    res.status(500).json({ error: 'An error occurred while saving the review.' });
  }
};

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
    const reviewsText = reviews.map((review) => `Review: "${review.fullReviewText}"`).join('\n\n');

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
app.post('/api/reviews/submit', submitReviewHandler);

// app.post('/api/reviews', structuredReviewHandler);
app.post('/api/reviews/structured', structuredReviewHandler);
app.post('/api/reviews/free-form', freeFormReviewHandler);
app.post('/api/reviews/parse', parseReviewHandler);
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