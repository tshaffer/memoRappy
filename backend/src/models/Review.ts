import mongoose, { Schema, Document, Model } from 'mongoose';
import { ReviewEntityWithFullText } from '../types'; // Update path accordingly

// Extend ReviewEntityWithFullText with mongoose's Document interface
interface IReview extends ReviewEntityWithFullText, Document {}

// Define the schema for the review
const ReviewSchema: Schema<IReview> = new Schema({
  restaurantName: { type: String, required: true },
  location: { type: String },
  dateOfVisit: { type: String },
  itemsOrdered: [{ type: String }],
  ratings: [{ item: String, rating: String }],
  overallExperience: { type: String },
  reviewer: { type: String },
  keywords: [{ type: String }],
  phrases: [{ type: String }],
  fullReviewText: { type: String, required: true },
});

// Create the Review model using the schema and external interface
const Review: Model<IReview> = mongoose.model<IReview>('Review', ReviewSchema);

export default Review;
