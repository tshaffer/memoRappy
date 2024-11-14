import { Request, Response } from 'express';
import { IReview } from "../models";
import Review from "../models/Review";

interface QueryReviewBody {
  fileName: string;
}

interface WouldReturnQuery {
  yes: boolean;
  no: boolean;
  notSpecified: boolean;
}

interface QueryParameters {
  location?: string;
  radius?: number;
  restaurantName?: string;
  dateRange?: any;
  wouldReturn: WouldReturnQuery;
  itemsOrdered?: any;
}

export const queryReviews = async (
  request: Request<{}, {}, QueryParameters>,
  response: Response
): Promise<void> => {

  const reviews: IReview[] = await performStructuredQuery(request.body);
  console.log('Query results:', reviews);
  response.json(reviews);
}

export const performStructuredQuery = async (parameters: QueryParameters): Promise<IReview[]> => {
  const {
    location,
    radius,
    restaurantName,
    dateRange,
    wouldReturn,
    itemsOrdered,
  } = parameters;

  console.log('Query parameters:', parameters);

  let query: any = {};

  query = buildWouldReturnQuery(wouldReturn);

  // if (restaurantName !== undefined) {
  //   query = { "structuredReviewProperties.restaurantName": restaurantName };
  // }

  console.log('Structured query:', query);
  const results: IReview[] = await Review.find(query);
  console.log('Structured results:', results);
  return results;
};

const buildWouldReturnQuery = (filter: WouldReturnQuery): any => {
  const values: (boolean | null)[] = [];
  
  if (filter.yes) values.push(true);
  if (filter.no) values.push(false);
  if (filter.notSpecified) values.push(null);

  if (values.length === 0) {
    // If no filters are selected, do not add any conditions for wouldReturn
    return {};
  }

  return { "structuredReviewProperties.wouldReturn": { $in: values } };
};

/*
export const chatty_performStructuredQuery = async (parameters: QueryParameters): Promise<IReview[]> => {
  const {
    location,
    radius,
    restaurantName,
    dateRange,
    wouldReturn,
    itemsOrdered,
  } = parameters;

  console.log('Query parameters:', parameters);

  let query: any = {};

  // Restaurant Name
  if (restaurantName !== undefined) {
    query["structuredReviewProperties.restaurantName"] = restaurantName;
  }

  // Would Return
  if (wouldReturn === true || wouldReturn === false) {
    query["structuredReviewProperties.wouldReturn"] = wouldReturn;
  } else if (wouldReturn === null) {
    query["structuredReviewProperties.wouldReturn"] = null;
  }

  // Date Range
  if (dateRange && dateRange.start && dateRange.end) {
    query["structuredReviewProperties.dateOfVisit"] = {
      $gte: dateRange.start,
      $lte: dateRange.end,
    };
  }

  // Items Ordered (assuming a partial text match)
  if (itemsOrdered && itemsOrdered.length > 0) {
    query["freeformReviewProperties.itemReviews.item"] = { $in: itemsOrdered };
  }

  // Location and Radius (assuming a geospatial query if location data is included)
  if (location && radius) {
    query["location.coordinates"] = {
      $geoWithin: {
        $centerSphere: [[location.longitude, location.latitude], radius / 3963.2], // Radius in miles; for km, use radius / 6378.1
      },
    };
  }

  console.log('Structured query:', query);
  const results: IReview[] = await Review.find(query);
  console.log('Structured results:', results);

  return results;
};
*/