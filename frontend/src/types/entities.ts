import { AddressComponent, GoogleGeometry } from "./GooglePlacesAPI";

export interface GooglePlaceResult {
  place_id: string;
  name: string;
  address_components?: AddressComponent[];
  formatted_address: string;
  geometry?: GoogleGeometry;
  website: string;
}

export interface StructuredReviewProperties {
  googlePlace: GooglePlaceResult;
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
  googlePlace: GooglePlaceResult;
  dateOfVisit: string;
  wouldReturn: boolean | null;
  itemReviews: [ItemReview]
  reviewer: string;
}

export interface ReviewEntityWithFullText extends ReviewEntity {
  reviewText: string;
}

export interface ChatResponse {
  parsedReviewProperties: ParsedReviewProperties;
  updatedReviewText: string;
}

export interface SubmitReviewBody {
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

