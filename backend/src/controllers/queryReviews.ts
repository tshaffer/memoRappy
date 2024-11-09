import { Request, Response } from 'express';
import { openai } from '../index';
import Review, { IReview } from '../models/Review';
import { getCoordinates } from './googlePlaces';
import { QueryRequestBody } from '../types';

interface QueryParameters {
  location?: string;
  radius?: number;
  restaurantName?: string;
  dateRange: any;
  wouldReturn: boolean | null;
  itemsOrdered: any;
}

interface ParsedQuery {
  queryType: 'structured' | 'full-text' | 'hybrid';
  queryParameters: QueryParameters;
}

export const queryReviewsHandler: any = async (
  req: Request<{}, {}, QueryRequestBody>,
  res: Response
): Promise<void> => {
  const { query } = req.body;

  try {
    const queryResults = await handleNaturalLanguageQuery(query);
    console.log(queryResults);
    res.status(200).json({ result: queryResults });
  } catch (error) {
    console.error('Error querying reviews:', error);
    res.status(500).json({ error: 'An error occurred while querying the reviews.' });
  }
};

const handleNaturalLanguageQuery = async (query: string): Promise<IReview[]> => {
  try {
    const parsedQuery: ParsedQuery = await parseQueryWithChatGPT(query);
    const { queryType, queryParameters } = parsedQuery;

    let reviews: IReview[] = [];

    if (queryType === "structured") {
      reviews = await performStructuredQuery(queryParameters);
    } else if (queryType === "full-text") {
      reviews = await performFullTextSearch(query, await Review.find());
    } else if (queryType === "hybrid") {
      const structuredResults = await performStructuredQuery(queryParameters);
      const fullTextResults = await performFullTextSearch(query, await Review.find());

      reviews = [...new Set([...structuredResults, ...fullTextResults])];
    }

    return reviews;
  } catch (error) {
    console.error("Error parsing query or fetching reviews:", error);
    return [];
  }
};

const new_handleNaturalLanguageQuery = async (query: string): Promise<any> => {
  try {
    // Step 1: Parse the query to identify the query type and parameters
    const parsedResponse = await new_parseQueryWithChatGPT(query);
    const { queryType, parameters } = JSON.parse(parsedResponse || "{}");

    // Step 2: Handle the return intent query type
    if (queryType === "return_intent") {
      const reviews = await Review.find();  // Fetch all reviews or relevant ones if needed

      // Step 3: Analyze each review for return intent and collect results
      const results = await Promise.all(
        reviews.map(async (review) => {
          const { explicitReturnIntent, inferredReturnIntent } = await analyzeReturnIntent(review.reviewText);

          return {
            reviewId: review._id,
            restaurantName: review.restaurantName,
            explicitReturnIntent,
            inferredReturnIntent,
            message: explicitReturnIntent !== "unknown"
              ? `The reviewer explicitly mentioned they ${explicitReturnIntent === 'yes' ? 'would' : 'would not'} return.`
              : inferredReturnIntent !== "unknown"
                ? `The reviewer did not state explicitly, but it can be inferred that they ${inferredReturnIntent === 'yes' ? 'would' : 'would not'} return.`
                : "The review did not provide enough information to determine if the reviewer would return.",
          };
        })
      );

      // Step 4: Return the formatted results
      return results;
    }

    // Step 5: Handle other types of queries if needed
    // e.g., location-based, item searches, etc.
    return handleOtherQueryTypes(queryType, parameters);
  } catch (error) {
    console.error("Error handling natural language query:", error);
    return [];
  }
};

const handleOtherQueryTypes = async (queryType: string, parameters: QueryParameters) => {

  console.log('handleOtherQueryTypes:', queryType, parameters);
  return [];

  // if (queryType === "structured") {
  //   return performStructuredQuery(parameters);
  // } else if (queryType === "full-text") {
  //   return performFullTextSearch("query", await Review.find());
  // } else if (queryType === "hybrid") {
  //   const structuredResults = await performStructuredQuery(parameters);
  //   const fullTextResults = await performFullTextSearch("query", await Review.find());

  //   return [...new Set([...structuredResults, ...fullTextResults])];
  // }

  // return [];
}

const new_parseQueryWithChatGPT = async (query: string) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `
          You are an assistant that analyzes restaurant reviews for questions related to whether the reviewer would return or recommend returning.
          For each query, extract structured parameters such as:
          - "queryType": "return_intent" if the query is about returning or recommending.
          - "explicit_return_intent" if explicitly stated (yes, no, or unknown).
          - "inferred_return_intent" if an inference can be made (yes, no, or unknown).

          Only return structured JSON, like this:
          { "queryType": "return_intent", "explicit_return_intent": "yes", "inferred_return_intent": "unknown" }
          
          If the question is not related to returning or recommending, indicate by using:
          { "queryType": "other" }
        `,
      },
      { role: "user", content: query },
    ],
  });

  return response.choices[0].message?.content;
};

const analyzeReturnIntent = async (reviewText: string): Promise<{ explicitReturnIntent: 'yes' | 'no' | 'unknown'; inferredReturnIntent: 'yes' | 'no' | 'unknown'; message: string }> => {
  
  console.log('analyzeReturnIntent:', reviewText);

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `You are an assistant analyzing restaurant reviews to determine if the reviewer would return. Carefully detect explicit positive or negative intent. For instance:
        - Positive examples: "I would return," "we’ll definitely go back."
        - Negative examples: "I don’t think we’ll return," "we won’t be coming back."
        Respond in JSON format with:
        - "explicitReturnIntent": "yes", "no", or "unknown" based on clear positive or negative statements about returning.
        - "inferredReturnIntent": "yes", "no", or "unknown" if there’s no explicit statement but sentiment can be inferred.
        - "message": A concise message explaining why the decision was made, referencing specific statements.`,
      },
      {
        role: "user",
        content: `Analyze the following review for return intent: "${reviewText}"`,
      },
    ],
  });

  const { content } = response.choices[0].message!;
  console.log('analyzeReturnIntent response:', content);
  const result = JSON.parse(content || "{}");
  console.log('analyzeReturnIntent result:', result);

  return {
    explicitReturnIntent: result.explicitReturnIntent || 'unknown',
    inferredReturnIntent: result.inferredReturnIntent || 'unknown',
    message: result.message || 'No clear return intent detected.',
  };
};

const parseQueryWithChatGPT = async (query: string): Promise<ParsedQuery> => {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `
        You are an assistant that converts natural language queries into structured parameters for searching restaurant reviews.
        Your task is to parse the query into structured fields that align with the fields in a restaurant review schema.
        
        Please extract any of the following fields as relevant from the user's query:
        - location: a city, region, or specific place (e.g., "Mountain View")
        - radius: a distance in meters, if provided (e.g., "within 10 miles")
        - date range: start and end dates for queries related to dates, formatted as YYYY-MM-DD
        - restaurantName: the name of a specific restaurant (e.g., "La Costena")
        - wouldReturn: whether the reviewer set Would Return. The value can be true, false, or null.
        - itemsOrdered: specific items ordered, if mentioned (e.g., "Caesar Salad")
        
        Determine the queryType based on the following:
        - If the query can be fully answered by matching structured fields in the database (e.g., location, date, restaurant name, items ordered), set "queryType" to "structured".
        - If the query requires searching full review text or user comments that are not part of structured fields, set "queryType" to "full-text".
        - If the query could benefit from both structured search and full-text search, set "queryType" to "hybrid".
        
        For each query, return a JSON object with the following format:
        {
          "queryType": "structured" or "full-text" or "hybrid",
          "queryParameters": {
            "location": "Location Name",
            "radius": Distance in meters,
            "dateRange": { "start": "YYYY-MM-DD", "end": "YYYY-MM-DD" },
            "restaurantName": "Restaurant Name",
            "wouldReturn": true or false or null,
            "itemsOrdered": ["Item1", "Item2", ...],
          }
        }
        
        If any field is missing, set its value to null. Return only the JSON data without additional text.
        
        Example inputs and outputs:
        Input: "Show me reviews for restaurants in Mountain View within the past month"
        Output: { "queryType": "structured", "parameters": { "location": "Mountain View", "radius": null, "dateRange": { "start": "YYYY-MM-01", "end": "YYYY-MM-DD" }, "restaurantName": null, "itemsOrdered": null } }
        
        Input: "What did I say about the Caesar Salad at Doppio Zero?"
        Output: { "queryType": "structured", "parameters": { "location": null, "radius": null, "dateRange": null, "restaurantName": "Doppio Zero", "itemsOrdered": ["Caesar Salad"] } }
        `
      },
      { role: "user", content: query },
    ],
  });

  const parsedContent = response.choices[0].message?.content || "{}";
  return JSON.parse(parsedContent) as ParsedQuery;
};

const performStructuredQuery = async (parameters: QueryParameters): Promise<IReview[]> => {
  const {
    location,
    radius,
    restaurantName,
    dateRange,
    wouldReturn,
    itemsOrdered,
  } = parameters;

  console.log('Query parameters:', parameters);

  const query: any = {};

  // Geospatial search for location and radius
  // Set default radius to 5000 if radius is null
  // radius units are meters
  const effectiveRadius = radius ?? 5000;
  if (location) {
    const coordinates = await getCoordinates(location); // Assume getCoordinates returns { lat: number; lng: number }
    if (coordinates) {
      query['place.geometry.location'] = {
        $near: {
          $geometry: { type: 'Point', coordinates: [coordinates.lng, coordinates.lat] },
          $maxDistance: effectiveRadius,
        },
      };
    }
  }

  if (restaurantName) {
    query.restaurantName = { $regex: restaurantName, $options: 'i' }; // 'i' for case-insensitive
  }

  if (itemsOrdered) {
    query.itemReviews = {
      $elemMatch: { item: { $regex: new RegExp(itemsOrdered.join("|"), "i") } }
    };
  }

  if (dateRange) {
    const { start, end } = dateRange;

    if (start && end) {
      query.dateOfVisit = { $gte: start, $lte: end };
    } else if (end) {
      query.dateOfVisit = { $lte: end };
    } else if (start) {
      query.dateOfVisit = { $gte: start };
    }
  }

  if (wouldReturn === true) {
    query.wouldReturn = true;
  } else if (wouldReturn === false) {
    query.wouldReturn = false;
  } else {
    query.wouldReturn = null;
  }
    
  console.log('Structured query:', query);
  const results: IReview[] = await Review.find(query);
  console.log('Structured results:', results);
  return results;
};

const performFullTextSearch = async (query: string, reviews: IReview[]): Promise<IReview[]> => {

  console.log('performFullTextSearch:', query, reviews);

  const reviewData = reviews.map(review => ({
    id: review._id,
    text: review.reviewText
  }));

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `You are a helpful assistant that retrieves relevant reviews based on full-text search. Only respond with JSON data, without any additional commentary.`,
      },
      {
        role: "user",
        content: `Find relevant reviews for: "${query}" in the following reviews: ${JSON.stringify(reviewData)}. 
        
        Return the results in the following JSON format:
  
        [
          { "_id": "review_id_1", "text": "review_text_1" },
          { "_id": "review_id_2", "text": "review_text_2" },
          ...
        ]`
      },
    ],
  });

  // Parse the JSON response as an array of objects
  const relevantReviews = JSON.parse(response.choices[0].message?.content || "[]");

  // Extract only the IDs if you need them in a separate array
  const relevantReviewIds: string[] = relevantReviews.map((review: { _id: string; text: string }) => review._id);

  // Filter out the relevant reviews based on IDs provided by ChatGPT
  return reviews.filter(review => review._id && relevantReviewIds.includes(review._id.toString()));
};






// code that is no longer used but I am keeping around for reference
const findNearbyReviews = async (lng: number, lat: number, maxDistance: number) => {
  return await Review.find({
    'place.geometry.location': {
      $near: {
        $geometry: { type: 'Point', coordinates: [lng, lat] },
        $maxDistance: maxDistance,
      },
    },
  });
};

const mergeResults = (structuredResults: any[], fullTextResults: any) => {
  // Example logic: prioritize structured results, append any unique insights from fullTextResults
  const combinedResults = [...structuredResults];

  if (fullTextResults && typeof fullTextResults === "string") {
    combinedResults.push({ fullTextAnalysis: fullTextResults });
  }

  return combinedResults;
};
