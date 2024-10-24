import mongoose, { Schema, Document } from 'mongoose';

// Define the interface for a review document
interface IReview extends Document {
  reviewer: string;
  restaurant: string;
  location: string;
  itemsOrdered: string[];
  ratings: { item: string; rating: string }[];
  overallExperience: string;
  dateOfVisit: string;
  reviewText: string; // Add the reviewText field
}

// Define the schema for the review
const ReviewSchema: Schema = new Schema({
  reviewer: { type: String, required: true },
  restaurant: { type: String, required: true },
  location: { type: String, required: true },
  itemsOrdered: [{ type: String }],
  ratings: [{ item: String, rating: String }],
  overallExperience: { type: String },
  dateOfVisit: { type: String, required: true },
  reviewText: { type: String, required: true }, // Add the field here to store the full review
});

// Create the Review model using the schema
const Review = mongoose.model<IReview>('Review', ReviewSchema);

export default Review;
