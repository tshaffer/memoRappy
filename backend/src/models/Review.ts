import mongoose, { Schema, Document, Model } from 'mongoose';
import { GoogleLocation, ReviewEntityWithFullText } from '../types';

interface IReview extends ReviewEntityWithFullText, Document { }

const LocationSchema: Schema<GoogleLocation> = new Schema({
  place_id: { type: String, required: true },
  name: { type: String, required: true },
  address: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
});

const ReviewSchema: Schema<IReview> = new Schema({
  restaurantName: { type: String, required: true },
  userLocation: { type: String },
  dateOfVisit: { type: String },
  itemsOrdered: [{ type: String }],
  ratings: [{ item: String, rating: String }],
  overallExperience: { type: String },
  reviewer: { type: String },
  keywords: [{ type: String }],
  phrases: [{ type: String }],
  googleLocation: { type: LocationSchema },  // Use Mixed type to allow different formats
  fullReviewText: { type: String, required: true },
});

const Review: Model<IReview> = mongoose.model<IReview>('Review', ReviewSchema);

export default Review;
