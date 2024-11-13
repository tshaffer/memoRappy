import { ChatCompletionMessageParam } from 'openai/resources/chat';
import { openai } from '../index';
// import { FreeformReviewProperties, SubmitReviewBody, ItemReview, MongoGeometry, MongoPlace, MongoReviewEntityWithFullText } from '../types';
import Review, { IReview } from "../models/Review";
import { extractFieldFromResponse, extractItemReviews, removeSquareBrackets } from '../utilities';
import { getMongoGeometryFromGoogleGeometry } from './googlePlaces';
import { FreeformReviewProperties, ItemReview } from '../types';

// Store conversations for each session
interface ReviewConversations {
  [sessionId: string]: ChatCompletionMessageParam[];
}
const reviewConversations: ReviewConversations = {};

export const parsePreview = async (sessionId: string, reviewText: string): Promise<FreeformReviewProperties> => {

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
        - List of items ordered with comments for each item, formatted as "itemReviews" with properties "item" and "review".
      
         Review: "${reviewText}"
      
        Format the response as follows:
        - Reviewer name: [Name]
        - Date of visit: [YYYY-MM-DD]
        - Item reviews: [{ "item": "Item 1", "review": "Review 1" }, { "item": "Item 2", "review": "Review 2" }]
        `,
      }
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

    const itemReviews: ItemReview[] = extractItemReviews(messageContent);

    // Extract structured information using adjusted parsing
    const freeformReviewProperties: FreeformReviewProperties = {
      reviewText,
      itemReviews,
      reviewer: removeSquareBrackets(extractFieldFromResponse(messageContent, 'Reviewer name')),
    };

    return freeformReviewProperties;
  } catch (error) {
    console.error('Error processing review preview:', error);
    throw new Error('Error processing review preview.');
  }
}

// export const submitReview = async (body: SubmitReviewBody) => {
//   const { _id, structuredReviewProperties, parsedReviewProperties, reviewText, sessionId } = body;

//   if (!structuredReviewProperties || !parsedReviewProperties || !reviewText || !sessionId) {
//     throw new Error('Incomplete review data.');
//   }

//   const { googlePlace, dateOfVisit, wouldReturn } = structuredReviewProperties;
//   const { itemReviews, reviewer } = parsedReviewProperties;

//   // Convert geometry from Google format to Mongoose format
//   const mongoGeometry: MongoGeometry = getMongoGeometryFromGoogleGeometry(googlePlace.geometry!);
//   const mongoPlace: MongoPlace = { ...googlePlace, geometry: mongoGeometry };

//   try {
//     const reviewData: MongoReviewEntityWithFullText = {
//       mongoPlace,
//       dateOfVisit,
//       wouldReturn,
//       itemReviews,
//       reviewer,
//       reviewText
//     };

//     let savedReview: IReview | null;

//     if (_id) {
//       // If _id is provided, update the existing document
//       savedReview = await Review.findByIdAndUpdate(_id, reviewData, {
//         new: true,    // Return the updated document
//         runValidators: true // Ensure the updated data complies with schema validation
//       });

//       if (!savedReview) {
//         throw new Error('Review not found for update.');
//       }
//     } else {
//       // If no _id, create a new document
//       const newReview = new Review(reviewData);
//       savedReview = await newReview.save();
//     }

//     // Clear conversation history for the session after submission
//     delete reviewConversations[sessionId];

//     return savedReview;
//   } catch (error) {
//     console.error('Error saving review:', error);
//     throw new Error('An error occurred while saving the review.');
//   }
// };
