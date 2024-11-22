import { ChatCompletionMessageParam } from 'openai/resources/chat';
import { openai } from '../index';
import { Request, Response } from 'express';
import Review, { IReview } from "../models/Review";
import { extractFieldFromResponse, extractItemReviews, removeSquareBrackets } from '../utilities';
import { ChatRequestBody, ChatResponse, FreeformReviewProperties, ItemReview, MemoRappReview, PreviewRequestBody, PreviewResponse, SubmitReviewBody } from '../types';
import { addPlace, getPlace } from './places';
import { IMongoPlace } from '../models';
import { addReview } from './reviews';
// import ItemOrdered, { IItemOrderedDocument } from '../models/ItemOrdered';
import ItemOrderedModel from '../models/ItemOrdered';
import { cosineSimilarity } from './textSimilarity';

// Store conversations for each session
interface ReviewConversations {
  [sessionId: string]: ChatCompletionMessageParam[];
}
const reviewConversations: ReviewConversations = {};

export const previewReviewHandler = async (
  req: Request<{}, {}, PreviewRequestBody>,
  res: Response
): Promise<any> => {

  console.log('Preview review request:', req.body); // Debugging log

  const { reviewText, sessionId } = req.body;

  try {
    const freeformReviewProperties: FreeformReviewProperties = await parsePreview(sessionId, reviewText);
    console.log('freeformReviewProperties:', freeformReviewProperties); // Debugging log
    const previewResponse: PreviewResponse = { freeformReviewProperties };
    return res.json(previewResponse);
  } catch (error) {
    console.error('Error processing review preview:', error);
    return res.status(500).json({ error: 'An error occurred while processing the review preview.' });
  }
};

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

export const chatReviewHandler = async (
  req: Request<{}, {}, ChatRequestBody>,
  res: Response
): Promise<void> => {
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

    const itemReviews: ItemReview[] = extractItemReviews(structuredDataText);

    const freeformReviewProperties: FreeformReviewProperties = {
      reviewText: updatedReviewText,
      itemReviews,
      reviewer: removeSquareBrackets(extractFieldFromResponse(structuredDataText, 'Reviewer name')),
    };

    const chatResponse: ChatResponse = {
      freeformReviewProperties,
      updatedReviewText,
    };

    res.json(chatResponse);
  } catch (error) {
    console.error('Error during chat interaction:', error);
    res.status(500).json({ error: 'An error occurred while processing the chat response.' });
  }
};


export const submitReviewHandler = async (req: Request, res: Response): Promise<any> => {

  const body: SubmitReviewBody = req.body;

  try {
    const newReview = await submitReview(body);
    return res.status(201).json({ message: 'Review saved successfully!', review: newReview });
  } catch (error) {
    console.error('Error saving review:', error);
    return res.status(500).json({ error: 'An error occurred while saving the review.' });
  }
};



export const submitReview = async (memoRappReview: SubmitReviewBody): Promise<IReview | null> => {

  const { _id, place, structuredReviewProperties, freeformReviewProperties, sessionId } = memoRappReview;
  const place_id = place.place_id;

  let mongoPlace: IMongoPlace | null = await getPlace(place_id);
  console.log('place:', place);
  if (!mongoPlace) {
    mongoPlace = await addPlace(place);
    if (!place) {
      throw new Error('Error saving place.');
    }
  }

  const { itemReviews } = freeformReviewProperties;
  // const allItemsOrderedDocs: any[] = await ItemOrdered.find({}).exec();
  // const allStandardizedNames: string[] = allItemsOrderedDocs.map((itemOrderedDoc: any) => itemOrderedDoc.toObject().standardizedName);

  for (const itemReview of itemReviews) {
    const inputName = itemReview.item;
    const matchedStandardizedName = await findBestMatch(inputName);
    console.log('matchedStandardizedName:', matchedStandardizedName);
    // const standardizedName: string | null = await getStandardizedNameFromDb(inputName);
    // if (!standardizedName) {
    //   const newItemOrdered: IItemOrderedDocument = new ItemOrdered({ inputName, standardizedName: inputName });
    //   await newItemOrdered.save();
    // } else {

      // ask chatty for similarity match
    // }
  }

  return null;

  // const addReviewBody: MemoRappReview = {
  //   place_id: place.place_id,
  //   structuredReviewProperties,
  //   freeformReviewProperties,
  // };

  // let savedReview: IReview | null;

  // if (_id) {
  //   // If _id is provided, update the existing document
  //   savedReview = await Review.findByIdAndUpdate(_id, addReviewBody, {
  //     new: true,    // Return the updated document
  //     runValidators: true // Ensure the updated data complies with schema validation
  //   });

  //   if (!savedReview) {
  //     throw new Error('Review not found for update.');
  //   }
  // } else {
  //   const newReview: IReview | null = await addReview(addReviewBody);
  //   console.log('newReview:', newReview?.toObject());
  // }

  // // Clear conversation history for the session after submission
  // delete reviewConversations[sessionId];

  // return null;
  // const newReview: IReview = new Review(memoRappReview);

}

// const getStandardizedNameFromDb = async (inputName: string): Promise<string | null> => {
//   const itemOrderedDocument: any = await ItemOrdered.find({ inputName }).exec();
//   if (!itemOrderedDocument) {
//     return null;
//   } else {
//     const itemOrdered: ItemOrdered = itemOrderedDocument.toObject();
//     return itemOrdered.standardizedName;
//   }
// }

const similarityThreshold = 0.8;

async function findBestMatch(inputName: string): Promise<string> {
  try {
    // Step 1: Fetch all items from the database
    const allItems = await ItemOrderedModel.find({}).exec();

    // Step 2: Generate embedding for inputName
    const inputEmbeddingResponse = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: inputName,
    });
    const inputEmbedding = inputEmbeddingResponse.data[0].embedding;

    if (allItems.length === 0) {
      // If no items exist, add inputName as a new standardizedName with its embedding
      const newItem = new ItemOrderedModel({
        inputName,
        standardizedName: inputName,
        embedding: inputEmbedding, // Save the embedding
      });
      await newItem.save();
      return inputName; // No match, treated as new
    }

    // Step 3: Compute similarity scores
    const similarities = allItems.map((item) => {
      if (item.embedding) {
        // Use existing embedding
        return {
          item,
          similarity: cosineSimilarity(inputEmbedding, item.embedding),
        };
      } else {
        return {
          item,
          similarity: 0, // Placeholder if no embedding is available
        };
      }
    });

    // Step 4: Find the best match
    const bestMatch = similarities.reduce((best, current) =>
      current.similarity > best.similarity ? current : best
    );

    // Step 5: Compare against threshold
    if (bestMatch.similarity >= similarityThreshold) {
      // Add the inputName and matched standardizedName to the database
      const matchedItem = new ItemOrderedModel({
        inputName,
        standardizedName: bestMatch.item.standardizedName, // Use the matched standardizedName
        embedding: inputEmbedding, // Save the embedding for the inputName
      });
      await matchedItem.save();

      return bestMatch.item.standardizedName; // Return the matched standardizedName
    }

    // Step 6: Add as a new standardizedName if no match
    const newItem = new ItemOrderedModel({
      inputName,
      standardizedName: inputName,
      embedding: inputEmbedding, // Save the embedding
    });
    await newItem.save();
    return inputName; // Treated as new
  } catch (error) {
    console.error("Error finding best match:", error);
    throw error;
  }
}

export const getStandardizedNames = async (request: Request, response: Response) => {
  try {
    const uniqueStandardizedNames: string[] = await ItemOrderedModel.distinct("standardizedName").exec();
    response.json(uniqueStandardizedNames);
  } catch (error) {
    console.error("Error fetching standardized names:", error);
    response.status(500).json({ error: "An error occurred while fetching standardized names." });
  }
};  