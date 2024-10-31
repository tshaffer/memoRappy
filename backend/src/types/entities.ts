export interface GoogleLocation {
  place_id?: string;
  name?: string;
  address?: string;
  latitude: number;
  longitude: number;
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
  googleLocation?: GoogleLocation;
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
  googleLocation: GoogleLocation;
}

export interface ReviewEntityWithFullText extends ReviewEntity {
  reviewText: string;
}

export interface ChatResponse {
  parsedReviewProperties: ParsedReviewProperties;
  updatedReviewText: string;
}
