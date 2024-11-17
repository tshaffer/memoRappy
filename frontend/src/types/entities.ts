import { GoogleGeometry } from "./GooglePlacesAPI";
import { MongoGeometry } from "./MongoPlacesAPI";
import { AddressComponent } from "./PlacesAPI";

export interface MemoRappReview {
  _id?: any; // mongoose.Types.ObjectId;
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

export interface GooglePlace {
  place_id: string;
  name: string;
  address_components?: AddressComponent[];
  formatted_address: string;
  geometry?: GoogleGeometry;
  website: string;
}

export interface MongoPlace {
  place_id: string;
  name: string;
  address_components?: AddressComponent[];
  formatted_address: string;
  geometry?: MongoGeometry;
  website: string;
}

export interface StructuredReviewProperties {
  googlePlace: GooglePlace;
  dateOfVisit: string;
  wouldReturn: boolean | null;
}

export interface ItemReview {
  item: string;
  review: string;
}

export interface ParsedReviewProperties {
  itemReviews: ItemReview[];
  reviewer: string;
}

export interface ReviewEntity {
  googlePlace: GooglePlace;
  dateOfVisit: string;
  wouldReturn: boolean | null;
  itemReviews: ItemReview[];
  reviewer: string;
}

export interface ReviewEntityWithFullText extends ReviewEntity {
  _id?: string;
  reviewText: string;
}

export interface MongoReviewEntity {
  mongoPlace: MongoPlace;
  dateOfVisit: string;
  wouldReturn: boolean | null;
  itemReviews: ItemReview[]
  reviewer: string;
}

export interface MongoReviewEntityWithFullText extends MongoReviewEntity {
  reviewText: string;
}

export interface ChatResponse {
  parsedReviewProperties: ParsedReviewProperties;
  updatedReviewText: string;
}

export interface SubmitReviewBody {
  _id?: string;
  structuredReviewProperties: StructuredReviewProperties;
  parsedReviewProperties: ParsedReviewProperties
  reviewText: string;
  sessionId: string;
}

export interface QueryRequestBody {
  query: string;
}

export interface PreviewRequestBody {
  reviewText: string;
  sessionId: string;
}




