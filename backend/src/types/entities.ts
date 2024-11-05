import { AddressComponent, Geometry } from "./GooglePlacesAPI";

export interface MemoRappPlaceProperties {
  place_id: string;
  name: string;
  address_components?: AddressComponent[];
  formatted_address: string;
  geometry?: Geometry;
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
  overallExperience: string;
  reviewer: string;
  keywords: string[];
  phrases: string[];
  placeProperties?: MemoRappPlaceProperties;
}

export interface ReviewEntity {
  restaurantName: string;
  userLocation: string;
  dateOfVisit: string;
  itemsOrdered: string[];
  ratings: { item: string; rating: string }[];
  overallExperience: string;
  reviewer: string;
  keywords: string[];
  phrases: string[];
  placeProperties: MemoRappPlaceProperties;
}

export interface ReviewEntityWithFullText extends ReviewEntity {
  reviewText: string;
}

export interface ChatResponse {
  parsedReviewProperties: ParsedReviewProperties;
  updatedReviewText: string;
}
