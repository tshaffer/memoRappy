import { Request, Response } from 'express';
import { IReview } from "../models";
import Review from "../models/Review";

interface QueryReviewBody {
  fileName: string;
}

interface QueryParameters {
  location?: string;
  radius?: number;
  restaurantName?: string;
  dateRange?: any;
  wouldReturn?: boolean | null;
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

  if (wouldReturn === true) {
    query = { "structuredReviewProperties.wouldReturn": true };
    // query.structuredReviewProperties.wouldReturn = true;
  } else if (wouldReturn === false) {
    query = { "structuredReviewProperties.wouldReturn": false };
    // query.structuredReviewProperties.wouldReturn = false;
  } else {
    query = { "structuredReviewProperties.wouldReturn": null };
    // query.structuredReviewProperties.wouldReturn = null;
  }

  console.log('Structured query:', query);
  const results: IReview[] = await Review.find(query);
  console.log('Structured results:', results);
  return results;
};

