import mongoose from "mongoose";
import { AddressComponent } from "./place";

export interface MemoRappPlace {
  place_id: string;
  name: string;
  address_components?: AddressComponent[];
  formatted_address: string;
  website: string;
}

export interface MemoRappReview {
  _id?: mongoose.Types.ObjectId;
  place_id: string;
  structuredReviewProperties: StructuredReviewProperties;
  freeformReviewProperties: FreeformReviewProperties;
}

export interface StructuredReviewProperties {
  dateOfVisit: string;
  wouldReturn: boolean | null;
}

export interface FreeformReviewProperties {
  reviewText: string;
  itemReviews: ItemReview[];
  reviewer?: string;
}

export interface ItemReview {
  item: string;
  review: string;
}

export interface SubmitReviewBody {
  _id?: string;
  structuredReviewProperties: StructuredReviewProperties;
  parsedReviewProperties: FreeformReviewProperties;
  sessionId: string;
}

