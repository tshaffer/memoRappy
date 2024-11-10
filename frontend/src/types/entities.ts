import { AddressComponent, MemoRappGeometry } from "./GooglePlacesAPI";

export interface MemoRappPlace {
  place_id: string;
  name: string;
  address_components?: AddressComponent[];
  formatted_address: string;
  geometry?: MemoRappGeometry;
  website: string;
}

export interface StructuredReviewProperties {
  restaurantName: string;
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
  place?: MemoRappPlace;
}

export interface ReviewEntity {
  restaurantName: string;
  dateOfVisit: string;
  wouldReturn: boolean | null;
  itemReviews: [ItemReview]
  reviewer: string;
  place: MemoRappPlace;
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
  structuredReviewProperties: StructuredReviewProperties;
  reviewText: string;
  sessionId: string;
}

