import { FreeformReviewProperties, ItemReview, MemoRappReview } from "./entities";
import { GooglePlace } from "./GooglePlacesAPI";

export interface EditableReview {
  place: GooglePlace;
  review: MemoRappReview;
}

export interface ReviewEntity {
  googlePlace: GooglePlace;
  dateOfVisit: string;
  wouldReturn: boolean | null;
  itemReviews: ItemReview[];
  reviewer: string;
  reviewText: string;
}

export interface ChatResponse {
  parsedReviewProperties: FreeformReviewProperties;
  updatedReviewText: string;
}

