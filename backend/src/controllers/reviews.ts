import { Request, Response } from 'express';
import Review, { IReview } from "../models/Review";
import { MongoGeometry, GoogleGeometry, MongoReviewEntityWithFullText, ReviewEntityWithFullText } from '../types';

// Get all reviews
export const reviewsRouter = async (req: Request, res: Response) => {
  try {
    const reviews: IReview[] = await Review.find({}).exec();
    const googleReviews: ReviewEntityWithFullText[] = reviews.map((review) => {
      const reviewObj: MongoReviewEntityWithFullText = review.toObject();
      const reviewEntityWithFullText: ReviewEntityWithFullText = {
        ...reviewObj,
        googlePlace: {
          ...reviewObj.mongoPlace,
          geometry: convertMongoGeometryToGoogleGeometry(reviewObj.mongoPlace.geometry!)
        }
      };
      return reviewEntityWithFullText
    });
    res.status(200).json({ googleReviews });
  } catch (error) {
    console.error('Error retrieving reviews:', error);
    res.status(500).json({ error: 'An error occurred while retrieving the reviews.' });
  }
};

export function convertMongoGeometryToGoogleGeometry(mongoGeometry: MongoGeometry): GoogleGeometry {
  return {
    location: {
      lat: mongoGeometry.location.coordinates[1], // GeoJSON uses [lng, lat]
      lng: mongoGeometry.location.coordinates[0]
    },
    viewport: {
      north: mongoGeometry.viewport.northeast.coordinates[1],
      south: mongoGeometry.viewport.southwest.coordinates[1],
      east: mongoGeometry.viewport.northeast.coordinates[0],
      west: mongoGeometry.viewport.southwest.coordinates[0]
    }
  };
}
