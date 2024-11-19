import { Request, response, Response } from 'express';
import { openai } from '../index';
import Review, { IReview } from '../models/Review';
import MongoPlace, { IMongoPlace } from '../models/MongoPlace';
import { FilterResponse, GooglePlace, MemoRappReview, QueryResponse } from '../types';
import { convertMongoPlacesToGooglePlaces } from '../utilities';

interface DateRange {
  start: string;
  end: string;
}

interface QueryParameters {
  location?: string;
  radius?: number;
  dateRange: DateRange;
  restaurantName?: string;
  wouldReturn: boolean | null;
  itemsOrdered: any;
}

interface StructuredQueryParams {
  distanceAwayQuery?: {
    lat: number;
    lng: number;
    radius: number; // in miles
  };
  wouldReturn?: {
    yes: boolean;
    no: boolean;
    notSpecified: boolean;
  };
  placeName?: string; // Partial name match for places
  reviewDateRange?: {
    start?: string; // ISO date string
    end?: string;   // ISO date string
  };
  itemsOrdered?: string[]; // Array of item names for filtering reviews
  additionalPlaceFilters?: Record<string, any>; // Additional Mongo filters for places
  additionalReviewFilters?: Record<string, any>; // Additional Mongo filters for reviews
}

interface QueryRequestBody {
  query: string;
}

interface ParsedQuery {
  queryType: 'structured' | 'full-text' | 'hybrid';
  queryParameters: QueryParameters;
}

export const naturalLanguageQueryHandler: any = async (
  req: Request<{}, {}, QueryRequestBody>,
  res: Response
): Promise<void> => {

  const query = req.body.query;
  let queryResponse: QueryResponse = {
    places: [],
    reviews: [],
  };

  try {
    const parsedQuery: ParsedQuery = await parseQueryWithChatGPT(query);
    const { queryType, queryParameters } = parsedQuery;

    console.log('Query:', query);
    console.log('Query parameters:', queryParameters);
    console.log('Parsed query:', parsedQuery);

    if (queryType === "structured") {
      const structuredQueryParams: StructuredQueryParams = buildStructuredQueryParamsFromParsedQuery(parsedQuery);
      console.log('Structured query params:', structuredQueryParams);
      queryResponse = await structuredQuery(structuredQueryParams);
    } else if (queryType === "full-text") {
      const places = await MongoPlace.find({});
      const reviews = await Review.find({});
      queryResponse = await performNaturalLanguageQuery(query, places, reviews);
    } else {
      const structuredQueryParams: StructuredQueryParams = buildStructuredQueryParamsFromParsedQuery(parsedQuery);
      console.log('Structured query params:', structuredQueryParams);
      queryResponse = await performHybridQuery(query, structuredQueryParams);
    }
  } catch (error) {
    console.error('Error querying reviews:', error);
    res.status(500).json({ error: 'An error occurred while querying the reviews.' });
  }
  console.log('Natural Language query response:', queryResponse);

  const { places, reviews } = queryResponse;
  const googlePlaces: GooglePlace[] = convertMongoPlacesToGooglePlaces(places);
  const memoRappReviews: MemoRappReview[] = reviews.map((review: IReview) => {
    return review.toObject();
  });

  const result: FilterResponse = {
    places: googlePlaces,
    reviews: memoRappReviews,
  };
  res.status(200).json({ result });
};


const buildStructuredQueryParamsFromParsedQuery = (parsedQuery: ParsedQuery): StructuredQueryParams => {
  const { queryParameters } = parsedQuery;
  const { location, radius, restaurantName, dateRange, wouldReturn, itemsOrdered } = queryParameters;
  const structuredQueryParams: StructuredQueryParams = {};

  // if (location) {
  //   structuredQueryParams.distanceAwayQuery = { lat: 0, lng: 0, radius: 0 };
  // }

  // if (wouldReturn) {
  //   structuredQueryParams.wouldReturn = { yes: false, no: false, notSpecified: false };
  // }

  if (restaurantName) {
    structuredQueryParams.placeName = restaurantName;
  }

  if (dateRange) {
    structuredQueryParams.reviewDateRange = { start: dateRange.start, end: dateRange.end };
  }

  if (itemsOrdered) {
    structuredQueryParams.itemsOrdered = itemsOrdered;
  }

  return structuredQueryParams;
}

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
        - If the query only references structured fields (e.g., location, date, restaurant name, items ordered), set "queryType" to "structured".
        - If the query only references full review text or user comments not part of structured fields, set "queryType" to "full-text".
        - If the query references both structured fields and full review text, set "queryType" to "hybrid".

        Return the results in the following JSON format:
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

        If any field is missing, set its value to null. Pay close attention to queries that include both structured and full-text elements and classify them as "hybrid".

        Example inputs and outputs:
        Input: "Show me reviews for restaurants in Mountain View within the past month"
        Output: { "queryType": "structured", "queryParameters": { "location": "Mountain View", "radius": null, "dateRange": { "start": "YYYY-MM-01", "end": "YYYY-MM-DD" }, "restaurantName": null, "wouldReturn": null, "itemsOrdered": null } }

        Input: "What did I say about the Caesar Salad at Doppio Zero?"
        Output: { "queryType": "structured", "queryParameters": { "location": null, "radius": null, "dateRange": null, "restaurantName": "Doppio Zero", "wouldReturn": null, "itemsOrdered": ["Caesar Salad"] } }

        Input: "Would I return to La Costena for the tacos?"
        Output: { "queryType": "structured", "queryParameters": { "location": null, "radius": null, "dateRange": null, "restaurantName": "La Costena", "wouldReturn": true, "itemsOrdered": ["tacos"] } }

        Input: "Show me reviews from August 2024 where the reviewer mentioned that parking was difficult"
        Output: { "queryType": "hybrid", "queryParameters": { "location": null, "radius": null, "dateRange": { "start": "2024-08-01", "end": "2024-08-31" }, "restaurantName": null, "wouldReturn": null, "itemsOrdered": null } }
        `
      },
      { role: "user", content: query },
    ],
  });

  const parsedContent = response.choices[0].message?.content || "{}";
  return JSON.parse(parsedContent) as ParsedQuery;
};

const structuredQuery = async (queryParams: StructuredQueryParams): Promise<QueryResponse> => {
  const {
    distanceAwayQuery,
    wouldReturn,
    placeName,
    reviewDateRange,
    itemsOrdered,
    additionalPlaceFilters,
    additionalReviewFilters
  } = queryParams;
  const { lat, lng, radius } = distanceAwayQuery || {};

  try {
    // Step 0: Initialize queries
    let placeQuery: any = {};
    let reviewQuery: any = {};

    // Step 1: Construct the Would Return filter for reviews
    if (wouldReturn) {
      const returnFilter: (boolean | null)[] = [];
      if (wouldReturn.yes) returnFilter.push(true);
      if (wouldReturn.no) returnFilter.push(false);
      if (wouldReturn.notSpecified) returnFilter.push(null);
      reviewQuery['structuredReviewProperties.wouldReturn'] = { $in: returnFilter };
    }

    // Step 2: Add reviewDateRange filter if provided
    if (reviewDateRange?.start || reviewDateRange?.end) {
      reviewQuery['structuredReviewProperties.dateOfVisit'] = {};
      if (reviewDateRange.start) {
        reviewQuery['structuredReviewProperties.dateOfVisit'].$gte = reviewDateRange.start;
      }
      if (reviewDateRange.end) {
        reviewQuery['structuredReviewProperties.dateOfVisit'].$lte = reviewDateRange.end;
      }
    }

    // Step 3: Add itemsOrdered filter if provided
    if (itemsOrdered && itemsOrdered.length > 0) {
      reviewQuery["freeformReviewProperties.itemReviews"] = {
        $elemMatch: { item: { $regex: new RegExp(itemsOrdered.join("|"), "i") } },
      };
    }

    // Step 4: Apply additional review filters if provided
    if (additionalReviewFilters) {
      Object.assign(reviewQuery, additionalReviewFilters);
    }

    // Fetch reviews matching reviewQuery
    let reviews: IReview[] = await Review.find(reviewQuery);

    // Step 5: Extract unique place IDs from the filtered reviews
    const placeIdsWithReviews = Array.from(new Set(reviews.map((review) => review.place_id)));
    if (placeIdsWithReviews.length === 0) {
      return { places: [], reviews: [] };
    }

    // Step 6: Construct the Place query
    if (lat !== undefined && lng !== undefined && radius !== undefined) {
      placeQuery['geometry.location'] = {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: radius * 1609.34, // Convert miles to meters
        },
      };
    }

    // Add name filter if provided
    if (placeName) {
      placeQuery['name'] = { $regex: new RegExp(placeName, 'i') }; // Case-insensitive partial match
    }

    // Add additional place filters if provided
    if (additionalPlaceFilters) {
      Object.assign(placeQuery, additionalPlaceFilters);
    }

    // Restrict to places that have matching reviews
    placeQuery['place_id'] = { $in: placeIdsWithReviews };

    // Fetch places matching placeQuery
    let places: IMongoPlace[] = await MongoPlace.find(placeQuery);

    // Step 7: Refine reviews to only those belonging to filtered places
    const filteredPlaceIds = places.map((place) => place.place_id);
    reviews = reviews.filter((review) => filteredPlaceIds.includes(review.place_id));

    // Combine results
    return {
      places,
      reviews,
    };
  } catch (error) {
    console.error('Error retrieving filtered places and reviews:', error);
    throw new Error('Failed to retrieve filtered data.');
  }
};

const performNaturalLanguageQuery = async (
  query: string,
  places: IMongoPlace[],
  reviews: IReview[]
): Promise<QueryResponse> => {
  console.log("performNaturalLanguageQuery:", query);

  // Step 1: Prepare data for OpenAI query
  const placeData = places.map(place => ({
    id: place.place_id,
    name: place.name,
    address: place.formatted_address,
    location: place.geometry?.location,
  }));

  const reviewData = reviews.map(review => ({
    id: review._id,
    text: review.freeformReviewProperties.reviewText,
    dateOfVisit: review.structuredReviewProperties.dateOfVisit,
    wouldReturn: review.structuredReviewProperties.wouldReturn,
    place_id: review.place_id,
  }));

  // Step 2: Call OpenAI API
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `You are a helpful assistant that retrieves relevant places and reviews based on a natural language query. Respond with JSON data only, without additional commentary.`,
      },
      {
        role: "user",
        content: `Find relevant places and reviews for the query: "${query}". 
        The places are: ${JSON.stringify(placeData)}. 
        The reviews are: ${JSON.stringify(reviewData)}.

        Return the results in the following JSON format:
        {
          "places": [
            { "id": "place_id_1" },
            { "id": "place_id_2" },
            ...
          ],
          "reviews": [
            { "id": "review_id_1" },
            { "id": "review_id_2" },
            ...
          ]
        }`,
      },
    ],
  });

  // Step 3: Parse the JSON response
  const result = JSON.parse(response.choices[0].message?.content || "{}");
  const relevantPlaceIds = result.places?.map((place: { id: string }) => place.id) || [];
  const relevantReviewIds = result.reviews?.map((review: { id: string }) => review.id) || [];

  // Step 4: Filter places and reviews based on IDs
  const filteredPlaces = places.filter(place => relevantPlaceIds.includes(place.place_id));
  const filteredReviews = reviews.filter(review => relevantReviewIds.includes(review._id!.toString()));

  // Step 5: Return the filtered data
  return {
    places: filteredPlaces,
    reviews: filteredReviews,
  };
};

const performHybridQuery = async (
  query: string,
  queryParams: StructuredQueryParams
): Promise<QueryResponse> => {
  const {
    distanceAwayQuery,
    wouldReturn,
    placeName,
    reviewDateRange,
    itemsOrdered,
    additionalPlaceFilters,
    additionalReviewFilters,
  } = queryParams;

  const { lat, lng, radius } = distanceAwayQuery || {};

  try {
    // Step 1: Perform structured filtering on places and reviews
    let placeQuery: any = {};
    let reviewQuery: any = {};

    // Would Return filter
    if (wouldReturn) {
      const returnFilter: (boolean | null)[] = [];
      if (wouldReturn.yes) returnFilter.push(true);
      if (wouldReturn.no) returnFilter.push(false);
      if (wouldReturn.notSpecified) returnFilter.push(null);
      reviewQuery['structuredReviewProperties.wouldReturn'] = { $in: returnFilter };
    }

    // Date range filter
    if (reviewDateRange?.start || reviewDateRange?.end) {
      reviewQuery['structuredReviewProperties.dateOfVisit'] = {};
      if (reviewDateRange.start) {
        reviewQuery['structuredReviewProperties.dateOfVisit'].$gte = reviewDateRange.start;
      }
      if (reviewDateRange.end) {
        reviewQuery['structuredReviewProperties.dateOfVisit'].$lte = reviewDateRange.end;
      }
    }

    // Items ordered filter
    if (itemsOrdered && itemsOrdered.length > 0) {
      reviewQuery["freeformReviewProperties.itemReviews"] = {
        $elemMatch: { item: { $regex: new RegExp(itemsOrdered.join("|"), "i") } },
      };
    }

    // Additional review filters
    if (additionalReviewFilters) {
      Object.assign(reviewQuery, additionalReviewFilters);
    }

    // Fetch structured reviews
    let reviews: IReview[] = await Review.find(reviewQuery);

    // Extract unique place IDs from the filtered reviews
    const placeIdsWithReviews = Array.from(new Set(reviews.map((review) => review.place_id)));
    if (placeIdsWithReviews.length === 0) {
      return { places: [], reviews: [] };
    }

    // Construct place query
    if (lat !== undefined && lng !== undefined && radius !== undefined) {
      placeQuery['geometry.location'] = {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: radius * 1609.34, // Convert miles to meters
        },
      };
    }

    // Place name filter
    if (placeName) {
      placeQuery['name'] = { $regex: new RegExp(placeName, 'i') }; // Case-insensitive partial match
    }

    // Additional place filters
    if (additionalPlaceFilters) {
      Object.assign(placeQuery, additionalPlaceFilters);
    }

    // Restrict places to those with matching reviews
    placeQuery['place_id'] = { $in: placeIdsWithReviews };

    // Fetch structured places
    let places: IMongoPlace[] = await MongoPlace.find(placeQuery);

    // Refine reviews to those matching structured places
    const filteredPlaceIds = places.map((place) => place.place_id);
    reviews = reviews.filter((review) => filteredPlaceIds.includes(review.place_id));

    // Step 2: Perform natural language query using OpenAI
    const placeData = places.map((place) => ({
      id: place.place_id,
      name: place.name,
      address: place.formatted_address,
      location: place.geometry?.location,
    }));

    const reviewData = reviews.map((review) => ({
      id: review._id,
      text: review.freeformReviewProperties.reviewText,
      dateOfVisit: review.structuredReviewProperties.dateOfVisit,
      wouldReturn: review.structuredReviewProperties.wouldReturn,
      place_id: review.place_id,
    }));

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that retrieves relevant places and reviews based on a natural language query. Only include reviews that explicitly match the query. Respond with JSON data only, without additional commentary.`,
        },
        {
          role: "user",
          content: `Find relevant places and reviews for the query: "${query}". 
          The reviews are: ${JSON.stringify(reviewData)}.
    
          Only include reviews that explicitly contain the term "${query}" or closely match it contextually. Do not include reviews that do not mention "${query}". 
    
          Return the results in the following JSON format:
          {
            "places": [
              { "id": "place_id_1" },
              { "id": "place_id_2" },
              ...
            ],
            "reviews": [
              { "id": "review_id_1" },
              { "id": "review_id_2" },
              ...
            ]
          }`,
        },
      ],
    });

    const result = JSON.parse(response.choices[0].message?.content || "{}");
    const relevantPlaceIds = result.places?.map((place: { id: string }) => place.id) || [];
    const relevantReviewIds = result.reviews?.map((review: { id: string }) => review.id) || [];

    // Step 3: Combine structured and full-text results
    const hybridPlaces = places.filter((place) => relevantPlaceIds.includes(place.place_id));
    const hybridReviews = reviews.filter((review) => relevantReviewIds.includes(review._id!.toString()));

    // Step 4: Return combined results
    return {
      places: hybridPlaces,
      reviews: hybridReviews,
    };
  } catch (error) {
    console.error("Error performing hybrid query:", error);
    throw new Error("Failed to perform hybrid query.");
  }
};
