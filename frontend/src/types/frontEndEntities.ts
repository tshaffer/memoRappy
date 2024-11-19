import { FreeformReviewProperties, ItemReview, MemoRappReview } from "./entities";
import { GooglePlace } from "./googlePlace";

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
  freeformReviewProperties: FreeformReviewProperties;
  updatedReviewText: string;
}

