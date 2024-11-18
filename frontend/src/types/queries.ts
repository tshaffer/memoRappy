import { GooglePlace, MemoRappReview } from "./entities";

export interface WouldReturnQuery {
  yes: boolean;
  no: boolean;
  notSpecified: boolean;
}

export type WouldReturnQuerySpec = (boolean | null)[];

export interface QueryParameters {
  lat?: number;
  lng?: number;
  radius?: number;
  restaurantName?: string;
  dateRange?: any;
  wouldReturn?: WouldReturnQuery;
  itemsOrdered?: any;
}

export interface DistanceAwayQuery {
  lat: number;
  lng: number;
  radius: number;
}

export interface FilterQueryParams {
  distanceAwayQuery?: DistanceAwayQuery;
  wouldReturn?: { yes: boolean; no: boolean; notSpecified: boolean };
}

export interface FilterResponse {
  places: GooglePlace[];
  reviews: MemoRappReview[];
}

export interface WouldReturnQuery {
  yes: boolean;
  no: boolean;
  notSpecified: boolean;
}
