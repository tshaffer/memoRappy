import { ChatCompletionMessageParam } from 'openai/resources/chat';
import { openai } from '../index';
import { ChatResponse, ParsedReviewProperties, MemoRappPlace, SubmitReviewBody } from '../types/';
import Review from "../models/Review";
import { extractCommentsFromItems, extractFieldFromResponse, extractListFromResponse, removeSquareBrackets } from '../utilities';
import { getRestaurantProperties } from './googlePlaces';
import { Request, Response } from 'express';

// Store conversations for each session
interface ReviewConversations {
  [sessionId: string]: ChatCompletionMessageParam[];
}
const reviewConversations: ReviewConversations = {};

export const parsePreview = async (sessionId: string, restaurantName: string, userLocation: string, reviewText: string): Promise<ParsedReviewProperties> => {
  
  // Initialize conversation history if it doesn't exist
  if (!reviewConversations[sessionId]) {
    reviewConversations[sessionId] = [
      {
        role: "system",
        content: `
        You are a helpful assistant aiding in extracting structured information from restaurant reviews.
        Your task is to extract details such as:
        - Reviewer name
        - Date of visit (in YYYY-MM-DD format)
        - List of items ordered
        - Comments about each item (with the format: "item name (comments)")
        - Overall experience

        Also, look for keywords and phrases that you might typically find in a restaurant review.

         Review: "${reviewText}"

        Format the response as follows:
        - Reviewer name: [Name]
        - Date of visit: [YYYY-MM-DD]
        - List of items ordered: [Item 1, Item 2, etc.]
        - Comments about each item: [Item 1 (Comment), Item 2 (Comment)]
        - Overall experience: [Overall Experience]
        - Keywords: [Keyword 1, Keyword 2, etc.]
        - Phrases: [Phrase 1, Phrase 2, etc.]
      `,
      },
    ];
  }
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
      throw new Error('Failed to extract data from the response.');
    }

    console.log('previewReviewHandler response:', messageContent); // Debugging log
    console.log('list of items ordered', extractListFromResponse(messageContent, 'List of items ordered'));
    console.log('comments about each item', extractCommentsFromItems(messageContent, 'Comments about each item'));

    const place: MemoRappPlace = await getRestaurantProperties(restaurantName, userLocation);

    // Extract structured information using adjusted parsing
    const parsedReviewProperties: ParsedReviewProperties = {
      itemsOrdered: extractListFromResponse(messageContent, 'List of items ordered').map(removeSquareBrackets),
      ratings: extractCommentsFromItems(messageContent, 'Comments about each item'), // Use the adjusted function
      overallExperience: removeSquareBrackets(extractFieldFromResponse(messageContent, 'Overall experience')),
      reviewer: removeSquareBrackets(extractFieldFromResponse(messageContent, 'Reviewer name')),
      keywords: extractListFromResponse(messageContent, 'Keywords').map(removeSquareBrackets),
      phrases: extractListFromResponse(messageContent, 'Phrases').map(removeSquareBrackets),
      place,
    };

    return parsedReviewProperties;
  } catch (error) {
    console.error('Error processing review preview:', error);
    throw new Error('Error processing review preview.');
  }
}

export const previewReviewHandler = async (req: Request, res: Response): Promise<any> => {

  const { structuredReviewProperties, reviewText, sessionId } = req.body;
  const { restaurantName, userLocation } = structuredReviewProperties;

  try {
    const parsedReviewProperties: ParsedReviewProperties = await parsePreview(sessionId, restaurantName, userLocation, reviewText);
    return res.json({ parsedReviewProperties });
  } catch (error) {
    console.error('Error processing review preview:', error);
    return res.status(500).json({ error: 'An error occurred while processing the review preview.' });
  }
};

export const chatReviewHandler = async (req: any, res: any): Promise<void> => {
  const { userInput, sessionId, reviewText } = req.body;

  if (!reviewConversations[sessionId]) {
    res.status(400).json({ error: 'Session not found. Start with a preview first.' });
    return;
  }

  // Add user input to the conversation
  reviewConversations[sessionId].push({ role: "user", content: userInput });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        ...reviewConversations[sessionId],
        {
          role: "system",
          content: `Please provide:
          1. The updated structured data based on the full conversation. Please ensure that the updated structured data begins with "Updated Structured Data:".
          2. An updated review text that incorporates the latest user modifications. Please ensure that the updated review text begins with "Updated Review Text:".

          Original Review: "${reviewText}"`,
        },
      ],
      max_tokens: 500,
      temperature: 0.5,
    });

    const messageContent = response.choices[0].message?.content;
    console.log('ChatGPT response:', messageContent); // Debugging log

    if (!messageContent) {
      res.status(500).json({ error: 'Failed to extract data from the response.' });
      return;
    }

    // Adjusted regular expressions to match the response format
    const structuredDataMatch = messageContent.match(/^Updated Structured Data:\s*([\s\S]*?)Updated Review Text:/m);
    const updatedReviewTextMatch = messageContent.match(/Updated Review Text:\s*"(.*)"/s);

    if (!structuredDataMatch || !updatedReviewTextMatch) {
      console.error('Parsing error: Expected structured data and updated review text not found');
      res.status(500).json({ error: 'Failed to parse updated data.' });
      return;
    }

    const structuredDataText = structuredDataMatch[1].trim();
    const updatedReviewText = updatedReviewTextMatch[1].trim();

    console.log('chatReviewHandler updatedReviewText:', updatedReviewText); // Debugging log
    console.log('list of items ordered', extractListFromResponse(updatedReviewText, 'List of items ordered'));
    console.log('comments about each item', extractListFromResponse(updatedReviewText, 'Comments about each item'));

    const parsedReviewProperties: ParsedReviewProperties = {
      itemsOrdered: extractListFromResponse(structuredDataText, 'List of items ordered').map(removeSquareBrackets),
      ratings: extractListFromResponse(structuredDataText, 'Comments').map((ratingString: string) => {
        const parts = ratingString.match(/(.+?)\s?\((.+?)\)/);
        return {
          item: parts ? parts[1].trim() : ratingString,
          rating: parts ? parts[2].trim() : '',
        };
      }),
      overallExperience: removeSquareBrackets(extractFieldFromResponse(structuredDataText, 'Overall experience')),
      reviewer: removeSquareBrackets(extractFieldFromResponse(structuredDataText, 'Reviewer name')),
      keywords: extractListFromResponse(structuredDataText, 'Keywords').map(removeSquareBrackets),
      phrases: extractListFromResponse(structuredDataText, 'Phrases').map(removeSquareBrackets),
    };

    const chatResponse: ChatResponse = {
      parsedReviewProperties,
      updatedReviewText,
    };

    res.json(chatResponse);
  } catch (error) {
    console.error('Error during chat interaction:', error);
    res.status(500).json({ error: 'An error occurred while processing the chat response.' });
  }
};

export const submitReview = async (body: SubmitReviewBody) => {

  const { structuredReviewProperties, parsedReviewProperties, reviewText, sessionId } = body;
  if (!structuredReviewProperties || !parsedReviewProperties || !reviewText || !sessionId) {
    throw new Error('Incomplete review data.');
  }

  const { restaurantName, userLocation, dateOfVisit } = structuredReviewProperties;
  const { itemsOrdered, ratings, overallExperience, reviewer, keywords, phrases, place } = parsedReviewProperties;
  if (!restaurantName) {
    throw new Error('Incomplete review data.');
  }

  try {
    const newReview = new Review({
      restaurantName,
      userLocation,
      dateOfVisit,
      itemsOrdered,
      ratings,
      overallExperience,
      reviewer,
      keywords,
      phrases,
      place,
      reviewText
    });

    await newReview.save();

    // Clear conversation history for the session after submission
    delete reviewConversations[sessionId];

    return newReview;
  } catch (error) {
    console.error('Error saving review:', error);
    throw new Error('An error occurred while saving the review.');
  }
}

export const submitReviewHandler = async (req: Request, res: Response): Promise<any> => {

  const body = req.body;

  try {
    const newReview = await submitReview(body);
    return res.status(201).json({ message: 'Review saved successfully!', review: newReview });
  } catch (error) {
    console.error('Error saving review:', error);
    return res.status(500).json({ error: 'An error occurred while saving the review.' });
  }
};
