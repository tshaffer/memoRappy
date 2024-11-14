import { Request, Response } from 'express';
import { IReview } from "../models";
import Review from "../models/Review";
import MongoPlace, { IMongoPlace } from '../models/MongoPlace';  


interface QueryReviewBody {
  fileName: string;
}

interface WouldReturnQuery {
  yes: boolean;
  no: boolean;
  notSpecified: boolean;
}

interface QueryParameters {
  lat?: number;
  lng?: number;
  radius?: number;
  restaurantName?: string;
  dateRange?: any;
  wouldReturn?: WouldReturnQuery;
  itemsOrdered?: any;
}

export const queryReviews = async (
  request: Request<{}, {}, QueryParameters>,
  response: Response
): Promise<void> => {

  const mongoPlaces: IMongoPlace[] = await performPlacesQuery(request.body);

  // const reviews: IReview[] = await performStructuredQuery(request.body);
  console.log('Query results:', mongoPlaces);
  response.json(mongoPlaces);
}

export const performPlacesQuery = async (parameters: QueryParameters): Promise<IMongoPlace[]> => {
  const {
    lat, lng,
    radius,
    restaurantName,
    dateRange,
    wouldReturn,
    itemsOrdered,
  } = parameters;

  console.log('Query parameters:', parameters);

  let query: any = {};

  if (lat !== undefined && lng !== undefined) {
    query = buildLocationQuery(lat, lng, radius);
  }

  console.log('Places query:', query);
  const results: IMongoPlace[] = await MongoPlace.find(query);
  console.log('Places results:', results);
  return results;
}

const buildLocationQuery = (lat: number, lng: number, radius: number | undefined): any => {
  const effectiveRadius = radius ?? 5000;
  // const query = {
  //   "place.geometry.location":
  //   {
  //     $near: {
  //       $geometry: { type: 'Point', coordinates: [lng, lat] },
  //       $maxDistance: effectiveRadius,
  //     }
  //   }
  // };
  const query = {
    "geometry.location": { // Use "geometry.location" instead of "place.geometry.location"
      $near: {
        $geometry: { type: "Point", coordinates: [lng, lat] },
        $maxDistance: effectiveRadius // in meters
      }
    }
  };
  console.log('Location query:', query);
  return query;
}


export const performStructuredQuery = async (parameters: QueryParameters): Promise<IReview[]> => {
  const {
    lat, lng,
    radius,
    restaurantName,
    dateRange,
    wouldReturn,
    itemsOrdered,
  } = parameters;

  console.log('Query parameters:', parameters);

  let query: any = {};

  if (wouldReturn !== undefined) {
    query = buildWouldReturnQuery(wouldReturn);
  }

  console.log('Structured query:', query);
  const results: IReview[] = await Review.find(query);
  console.log('Structured results:', results);
  return results;
};

const buildWouldReturnQuery = (wouldReturn: WouldReturnQuery): any => {
  const values: (boolean | null)[] = [];

  if (wouldReturn.yes) values.push(true);
  if (wouldReturn.no) values.push(false);
  if (wouldReturn.notSpecified) values.push(null);

  if (values.length === 0) {
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