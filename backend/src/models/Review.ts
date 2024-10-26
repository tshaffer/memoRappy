import mongoose, { Schema, Document } from 'mongoose';

// Define the interface for a review document
interface IReview extends Document {
  restaurantName: string;
  location: string;
  dateOfVisit: string;
  itemsOrdered: string[];
  ratings: { item: string; rating: string }[];
  overallExperience: string;
  reviewer: string;
  keywords: string[];
  phrases: string[];
  fullReviewText: string;
}

// Define the schema for the review
const ReviewSchema: Schema = new Schema({
  restaurantName: { type: String, required: true },
  location: { type: String},
  dateOfVisit: { type: String },
  itemsOrdered: [{ type: String }],
  ratings: [{ item: String, rating: String }],
  overallExperience: { type: String },
  reviewer: { type: String },
  keywords: [{ type: String }],
  phrases: [{ type: String }],
  fullReviewText: { type: String, required: true },
});

// Create the Review model using the schema
const Review = mongoose.model<IReview>('Review', ReviewSchema);

export default Review;
