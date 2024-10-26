import mongoose, { Schema, Document } from 'mongoose';

// Define the interface for a review document
interface IReview extends Document {
  reviewer: string;
  restaurantName: string;
  location: string;
  itemsOrdered: string[];
  ratings: { item: string; rating: string }[];
  overallExperience: string;
  dateOfVisit: string;
  keywords: string[];
  phrases: string[];
  fullReviewText: string;
}

// Define the schema for the review
const ReviewSchema: Schema = new Schema({
  reviewer: { type: String },
  restaurantName: { type: String, required: true },
  location: { type: String},
  itemsOrdered: [{ type: String }],
  ratings: [{ item: String, rating: String }],
  overallExperience: { type: String },
  dateOfVisit: { type: String },
  keywords: [{ type: String }],
  phrases: [{ type: String }],
  fullReviewText: { type: String, required: true }, // Add the field here to store the full review
});

// Create the Review model using the schema
const Review = mongoose.model<IReview>('Review', ReviewSchema);

export default Review;
