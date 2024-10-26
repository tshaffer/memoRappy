import { ChatCompletionMessageParam } from 'openai/resources/chat';

import { openai } from '../index';

import { ReviewEntity } from '../types/';
import Review from "../models/Review";
import { extractFieldFromResponse, extractListFromResponse, removeSquareBrackets } from '../utilities';

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
          
          Also, look for keywords and phrases that you might typically find in a restaurant review.

          Review: "${reviewText}"
          
          Please provide the response in the following format:
          
          - Reviewer name: [Reviewer Name]
          - Restaurant name: [Restaurant Name]
          - Location: [Location]
          - Date of visit: [YYYY-MM-DD]
          - List of items ordered: [Item 1, Item 2, etc.]
          - Ratings for each item: [Item 1 (Rating), Item 2 (Rating)]
          - Overall experience: [Overall Experience]
          - Keywords: [Keyword 1, Keyword 2, etc.]
          - Phrases: [Phrase 1, Phrase 2, etc.]
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

    console.log('previewReviewHandler response:', messageContent);
    
    // Parse response data into a structured format
    const parsedData: ReviewEntity = {
      restaurantName: removeSquareBrackets(extractFieldFromResponse(messageContent, 'Restaurant name')),
      location: removeSquareBrackets(extractFieldFromResponse(messageContent, 'Location')),
      dateOfVisit: removeSquareBrackets(extractFieldFromResponse(messageContent, 'Date of visit')),
      itemsOrdered: extractListFromResponse(messageContent, 'List of items ordered').map(removeSquareBrackets),
      ratings: extractListFromResponse(messageContent, 'Ratings for each item').map((ratingString: string) => {
        const cleanedString = removeSquareBrackets(ratingString);
        const parts = cleanedString.match(/(.+?)\s?\((.+?)\)/);
        return {
          item: parts ? parts[1].trim() : cleanedString,
          rating: parts ? parts[2].trim() : '',
        };
      }),
      overallExperience: removeSquareBrackets(extractFieldFromResponse(messageContent, 'Overall experience')),
      reviewer: removeSquareBrackets(extractFieldFromResponse(messageContent, 'Reviewer name')),
      keywords: extractListFromResponse(messageContent, 'Keywords').map(removeSquareBrackets),
      phrases: extractListFromResponse(messageContent, 'Phrases').map(removeSquareBrackets),
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

  if (!parsedData || !parsedData.restaurantName || !parsedData.dateOfVisit) {
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

