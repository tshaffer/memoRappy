import { Request, Response } from 'express';
import { openai } from '../index';
import Review, { IReview } from '../models/Review';
import { getCoordinates } from './googlePlaces';

interface QueryRequestBody {
  query: string;
}

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

export const naturalLanguageQueryHandler: any = async (
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
        - wouldReturn: whether the reviewer set Would Return (if it explicitly or implicitly indicates a return intent). The value can be true, false, or null.
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
            "itemsOrdered": ["Item1", "Item2", ...]
          }
        }
        
        If any field is missing, set its value to null. Return only the JSON data without additional text.
        
        Example inputs and outputs:
        Input: "Show me reviews for restaurants in Mountain View within the past month"
        Output: { "queryType": "structured", "queryParameters": { "location": "Mountain View", "radius": null, "dateRange": { "start": "YYYY-MM-01", "end": "YYYY-MM-DD" }, "restaurantName": null, "wouldReturn": null, "itemsOrdered": null } }
        
        Input: "What did I say about the Caesar Salad at Doppio Zero?"
        Output: { "queryType": "structured", "queryParameters": { "location": null, "radius": null, "dateRange": null, "restaurantName": "Doppio Zero", "wouldReturn": null, "itemsOrdered": ["Caesar Salad"] } }
        
        Input: "Would I return to La Costena for the tacos?"
        Output: { "queryType": "structured", "queryParameters": { "location": null, "radius": null, "dateRange": null, "restaurantName": "La Costena", "wouldReturn": true, "itemsOrdered": ["tacos"] } }
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
    query["freeformReviewProperties.itemReviews"] = {
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
    text: review.toObject().reviewText
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

