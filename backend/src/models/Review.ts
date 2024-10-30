import mongoose, { Schema, Document, Model } from 'mongoose';
import { GoogleLocationInfo, ReviewEntityWithFullText } from '../types';

interface IReview extends ReviewEntityWithFullText, Document { }

const LocationSchema: Schema<GoogleLocationInfo> = new Schema({
  place_id: { type: String, required: true },
  name: { type: String, required: true },
  address: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
});

const ReviewSchema: Schema<IReview> = new Schema({
  restaurantName: { type: String, required: true },
  userLocation: { type: Schema.Types.Mixed, required: true },  // Use Mixed type to allow different formats
  dateOfVisit: { type: String },
  itemsOrdered: [{ type: String }],
  ratings: [{ item: String, rating: String }],
  overallExperience: { type: String },
  reviewer: { type: String },
  keywords: [{ type: String }],
  phrases: [{ type: String }],
  fullReviewText: { type: String, required: true },
});

const Review: Model<IReview> = mongoose.model<IReview>('Review', ReviewSchema);

export default Review;
