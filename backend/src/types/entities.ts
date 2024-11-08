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
  userLocation: string;
  dateOfVisit: string;
}

export interface ParsedReviewProperties {
  itemsOrdered: string[];
  ratings: { item: string; rating: string }[];
  reviewer: string;
  place?: MemoRappPlace;
}

export interface ReviewEntity {
  restaurantName: string;
  userLocation: string;
  dateOfVisit: string;
  itemsOrdered: string[];
  ratings: { item: string; rating: string }[];
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