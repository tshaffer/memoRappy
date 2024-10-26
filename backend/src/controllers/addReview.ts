import { ChatCompletionMessageParam } from 'openai/resources/chat';

import { openai } from '../index';

import Review from "../models/Review";
import { extractFieldFromResponse, extractListFromResponse } from '../utilities';

// Store conversations for each session
const reviewConversations: { [sessionId: string]: ChatCompletionMessageParam[] } = {};

// Preview endpoint to get structured data without saving
export const previewReviewHandler = async (req: any, res: any): Promise<void> => {
  const { restaurantName, reviewText, sessionId } = req.body;

  // Initialize session conversation history if it doesn't exist
  if (!reviewConversations[sessionId]) {
    reviewConversations[sessionId] = [
      {
        role: "system",
        content: `
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
        `,
      }
    ];
  }

  // Add user input as the latest message in the conversation history
  reviewConversations[sessionId].push({
    role: "user",
    content: reviewText,
  });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: reviewConversations[sessionId],
      max_tokens: 500,
      temperature: 0.5,
    });

    const messageContent = response.choices[0].message?.content;
    if (!messageContent) {
      res.status(500).json({ error: 'Failed to extract data from the response.' });
      return;
    }

    // Parse response data into a structured format
    const parsedData = {
      restaurantName,
      reviewer: extractFieldFromResponse(messageContent, 'Reviewer name'),
      location: extractFieldFromResponse(messageContent, 'Location'),
      dateOfVisit: extractFieldFromResponse(messageContent, 'Date of visit'),
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

    res.json({ parsedData });
  } catch (error) {
    console.error('Error processing review preview:', error);
    res.status(500).json({ error: 'An error occurred while processing the review preview.' });
  }
};

// Submit endpoint to save structured review in the database
export const submitReviewHandler = async (req: any, res: any) => {
  const { parsedData } = req.body;

  if (!parsedData || !parsedData.restaurant || !parsedData.dateOfVisit) {
    return res.status(400).json({ error: 'Incomplete review data.' });
  }

  try {
    const newReview = new Review(parsedData);
    await newReview.save();

    return res.status(201).json({ message: 'Review saved successfully!', review: newReview });
  } catch (error) {
    console.error('Error saving review:', error);
    return res.status(500).json({ error: 'An error occurred while saving the review.' });
  }
};

