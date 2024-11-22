import { GooglePlace } from "./googlePlace";
import { AddressComponent } from "./place";

export interface MemoRappReview {
  _id?: any;
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

export interface ItemOrdered {
  inputName: string;
  standardizedName: string;
}

export interface ItemReview {
  item: string;
  standardizedName?: string;
  review: string;
}

export interface SubmitReviewBody {
  _id?: string;
  place: GooglePlace;
  structuredReviewProperties: StructuredReviewProperties;
  freeformReviewProperties: FreeformReviewProperties;
  reviewText: string;
  sessionId: string;
}

export interface PreviewRequestBody {
  reviewText: string;
  sessionId: string;
}

export interface ChatRequestBody {
  userInput: string;
  sessionId: string;
  reviewText: string;
}

export interface MemoRappPlace {
  place_id: string;
  name: string;
  address_components?: AddressComponent[];
  formatted_address: string;
  website: string;
}

export interface QueryRequestBody {
  query: string;
}

export interface PreviewResponse {
  freeformReviewProperties: FreeformReviewProperties;
}

export interface ChatResponse {
  freeformReviewProperties: FreeformReviewProperties;
  updatedReviewText: string;
}

