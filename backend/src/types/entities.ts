export interface PlaceProperties extends MemoRappPlaceProperties {
  cityName: string | null;
  latitude: number;
  longitude: number;
}

export interface MemoRappPlaceProperties {
  place_id: string;
  name: string;
  formatted_address: string;
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
  placeProperties?: PlaceProperties;
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
  placeProperties: PlaceProperties;
}

export interface ReviewEntityWithFullText extends ReviewEntity {
  reviewText: string;
}

export interface ChatResponse {
  parsedReviewProperties: ParsedReviewProperties;
  updatedReviewText: string;
}
