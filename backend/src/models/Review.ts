import mongoose, { Schema, Document, Model } from 'mongoose';
import { PlaceProperties, ReviewEntityWithFullText } from '../types';

interface IReview extends ReviewEntityWithFullText, Document { }

const PlacePropertiesSchema: Schema<PlaceProperties> = new Schema({
  place_id: { type: String, required: true },
  name: { type: String, required: true },
  formatted_address: { type: String, required: true },
  cityName: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  website: { type: String },
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
  placeProperties: { type: PlacePropertiesSchema },
  reviewText: { type: String, required: true },
});

const Review: Model<IReview> = mongoose.model<IReview>('Review', ReviewSchema);

export default Review;
