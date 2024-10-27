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

  // Initialize conversation history if it doesn't exist
  if (!reviewConversations[sessionId]) {
    reviewConversations[sessionId] = [
      {
        role: "system",
        content: `
          You are a helpful assistant aiding in extracting structured information from restaurant reviews.
          Your task is to extract details such as:
          - Reviewer name
          - Restaurant name
          - Location
          - Date of visit (in YYYY-MM-DD format)
          - Items ordered with ratings (if available)
          - Overall experience
          - Keywords and phrases relevant to the review.

          Format the response as follows:
          - Reviewer name: [Name]
          - Restaurant name: [Name]
          - Location: [Location]
          - Date of visit: [YYYY-MM-DD]
          - List of items ordered: [Item 1, Item 2, etc.]
          - Ratings: [Item 1 (Rating), Item 2 (Rating)]
          - Overall experience: [Overall Experience]
          - Keywords: [Keyword 1, Keyword 2]
          - Phrases: [Phrase 1, Phrase 2]
        `,
      },
    ];
  }

  // Add user input as the latest message in the conversation history
  reviewConversations[sessionId].push({ role: "user", content: reviewText });

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

    // Parse response into structured data
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

    // Respond with parsed data
    res.json({ parsedData });
  } catch (error) {
    console.error('Error processing review preview:', error);
    res.status(500).json({ error: 'An error occurred while processing the review preview.' });
  }
};

// Chat endpoint for ongoing conversation
export const chatReviewHandler = async (req: any, res: any): Promise<void> => {
  const { userInput, sessionId, existingReviewText } = req.body;

  if (!reviewConversations[sessionId]) {
    res.status(400).json({ error: 'Session not found. Start with a preview first.' });
    return;
  }

  // Add user input to the conversation
  reviewConversations[sessionId].push({ role: "user", content: userInput });

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

    // Extract updated review text and structured data
    const updatedReviewText = messageContent.match(/Updated Review Text:\s*"(.+?)"/)?.[1] ?? existingReviewText;
    const structuredDataJSON = messageContent.match(/Structured Data:\s*(\{.*\})/s)?.[1];
    const parsedData = structuredDataJSON ? JSON.parse(structuredDataJSON) : null;

    // Send updated review text and structured data
    res.json({ updatedReviewText, parsedData });
  } catch (error) {
    console.error('Error during chat interaction:', error);
    res.status(500).json({ error: 'An error occurred while processing the chat response.' });
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

    // Clear conversation history for the session after submission
    delete reviewConversations[req.body.sessionId];

    return res.status(201).json({ message: 'Review saved successfully!', review: newReview });
  } catch (error) {
    console.error('Error saving review:', error);
    return res.status(500).json({ error: 'An error occurred while saving the review.' });
  }
};
