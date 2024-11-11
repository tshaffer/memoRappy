import mongoose, { Schema, Document, Model } from 'mongoose';
import { GeoJSONPoint, MongoGeometry, GooglePlaceResult, MongoReviewEntityWithFullText } from '../types';

export interface IReview extends MongoReviewEntityWithFullText, Document { }

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
const GeometrySchema: Schema<MongoGeometry> = new Schema({
  location: { type: LocationSchema, required: true },
  location_type: { type: String },
  viewport: {
    northeast: { type: LocationSchema, required: true },
    southwest: { type: LocationSchema, required: true },
  },
});

GeometrySchema.index({ location: '2dsphere' }); // Enable 2dsphere index for geospatial queries

const PlaceSchema: Schema<GooglePlaceResult> = new Schema({
  place_id: { type: String, required: true },
  name: { type: String, required: true },
  address_components: [{ type: AddressComponentSchema, required: true }], // Make this an array
  formatted_address: { type: String, required: true },
  geometry: { type: GeometrySchema, required: true },
  website: { type: String },
});

const ItemReviewSchema: Schema = new Schema({
  item: { type: String, required: true },
  review: { type: String, required: true },
});

const ReviewSchema: Schema<IReview> = new Schema({
  dateOfVisit: { type: String },
  wouldReturn: { type: Boolean },
  itemReviews: [ItemReviewSchema],
  reviewer: { type: String },
  mongoPlace: { type: PlaceSchema },
  reviewText: { type: String, required: true },
});

const Review: ReviewModel = mongoose.model<IReview>('Review', ReviewSchema);

export default Review;
