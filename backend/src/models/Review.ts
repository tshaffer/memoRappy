import mongoose, { Schema, Document, Model } from 'mongoose';
import { GeoJSONPoint, MemoRappGeometry, MemoRappPlace, ReviewEntityWithFullText } from '../types';

export interface IReview extends ReviewEntityWithFullText, Document { }

export type ReviewModel = Model<IReview>;

// Define AddressComponent Schema
const AddressComponentSchema: Schema = new Schema({
  long_name: { type: String, required: true },
  short_name: { type: String, required: true },
  types: [{ type: String, required: true }],
});

// Define Location Schema for GeoJSON Point
const LocationSchema: Schema = new Schema<GeoJSONPoint>({
  type: { type: String, enum: ['Point'], required: true, default: 'Point' },
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: true,
  },
});

// Define Geometry Schema, including GeoJSON `location` as `LocationSchema`
const GeometrySchema: Schema<MemoRappGeometry> = new Schema({
  location: { type: LocationSchema, required: true },
  location_type: { type: String },
  viewport: {
    northeast: { type: LocationSchema, required: true },
    southwest: { type: LocationSchema, required: true },
  },
});

GeometrySchema.index({ location: '2dsphere' }); // Enable 2dsphere index for geospatial queries

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

const Review: ReviewModel = mongoose.model<IReview>('Review', ReviewSchema);

export default Review;
