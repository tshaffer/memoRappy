export interface GoogleLocationInfo {
  place_id?: string;
  name?: string;
  address?: string;
  latitude: number;
  longitude: number;
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
}

export interface ReviewEntityWithFullText extends ReviewEntity {
  fullReviewText: string;
  googleLocation: GoogleLocationInfo;
}
