import mongoose, { Schema, Document, Model } from 'mongoose';
import { MemoRappPlace, ReviewEntityWithFullText } from '../types';

interface IReview extends ReviewEntityWithFullText, Document { }

// Define AddressComponent Schema
const AddressComponentSchema: Schema = new Schema({
  long_name: { type: String, required: true },
  short_name: { type: String, required: true },
  types: [{ type: String, required: true }],
});

// Define Location Schema for Geometry
const LocationSchema: Schema = new Schema({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
});

// Define Geometry Schema
const GeometrySchema: Schema = new Schema({
  location: { type: LocationSchema, required: true },
  location_type: { type: String },
  viewport: {
    northeast: { type: LocationSchema, required: true },
    southwest: { type: LocationSchema, required: true },
  },
});

const PlaceSchema: Schema<MemoRappPlace> = new Schema({
  place_id: { type: String, required: true },
  name: { type: String, required: true },
  address_components: [{ type: AddressComponentSchema, required: true }], // Make this an array
  formatted_address: { type: String, required: true },
  geometry: { type: GeometrySchema, required: true },
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
  place: { type: PlaceSchema },
  reviewText: { type: String, required: true },
});

const Review: Model<IReview> = mongoose.model<IReview>('Review', ReviewSchema);

export default Review;
