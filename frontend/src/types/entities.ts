export interface LocationInfo {
  place_id?: string;
  name?: string;
  address?: string;
  latitude: number;
  longitude: number;
}

export interface ReviewEntity {
  restaurantName: string;
  location: LocationInfo | string | null;  // Union type
  dateOfVisit: string;
  itemsOrdered: string[];
  ratings: { item: string; rating: string }[];
  overallExperience: string;
  reviewer: string;
  keywords: string[];
  phrases: string[];
}

export interface ReviewEntityWithFullText extends ReviewEntity {
  fullReviewText: string;
}
