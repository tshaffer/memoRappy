import { GoogleGeometry } from "./GooglePlacesAPI";
import { AddressComponent } from "./PlacesAPI";

export interface EditableReview {
  place: GooglePlace;
  review: MemoRappReview;
}

export interface MemoRappReview {
  _id?: any;
  place_id: string;
  structuredReviewProperties: StructuredReviewProperties;
  freeformReviewProperties: FreeformReviewProperties;
}

export interface StructuredReviewProperties {
  dateOfVisit: string;
  wouldReturn: boolean | null;
}

export interface FreeformReviewProperties {
  reviewText: string;
  itemReviews: ItemReview[];
  reviewer?: string;
}

export interface GooglePlace {
  place_id: string;
  name: string;
  address_components?: AddressComponent[];
  formatted_address: string;
  geometry?: GoogleGeometry;
  website: string;
}

export interface ItemReview {
  item: string;
  review: string;
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

export interface SubmitReviewBody {
  _id?: string;
  place: GooglePlace
  structuredReviewProperties: StructuredReviewProperties;
  freeformReviewProperties: FreeformReviewProperties
  reviewText: string;
  sessionId: string;
}

export interface QueryRequestBody {
  query: string;
}

export interface PreviewRequestBody {
  reviewText: string;
  sessionId: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}




