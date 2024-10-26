export interface ReviewEntity {
  restaurantName: string;
  location: string;
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
