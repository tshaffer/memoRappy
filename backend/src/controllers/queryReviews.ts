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

  // const mongoPlaces: IMongoPlace[] = await performPlacesQuery(request.body);
  // console.log('Query results:', mongoPlaces);
  // response.json(mongoPlaces);

  const reviews: IReview[] = await performStructuredQuery(request.body);
  console.log('Query results:', reviews);
  response.json(reviews);
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

export const getCountsByWouldReturnHandler = async (
  request: Request,
  response: Response
): Promise<void> => {
  const placeId = request.body.placeId;
  const results = await getCountsByWouldReturn(placeId);
  response.json(results);
}

const getCountsByWouldReturn = async (placeId: string): Promise<any> => {
  const results = await Review.aggregate([
    {
      $match: { place_id: placeId } // Filter reviews by the given place_id
    },
    {
      $group: {
        _id: "$structuredReviewProperties.wouldReturn", // Group by wouldReturn value
        count: { $sum: 1 } // Count the number of documents in each group
      }
    }
  ]);

  const counts = {
    yesCount: 0,
    noCount: 0,
    nullCount: 0,
  };

  // Map results to the appropriate properties
  results.forEach((result) => {
    if (result._id === true) {
      counts.yesCount = result.count;
    } else if (result._id === false) {
      counts.noCount = result.count;
    } else if (result._id === null) {
      counts.nullCount = result.count;
    }
  });

  return counts;
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