import { IMongoPlace, IReview } from "../models";
import { MemoRappReview } from "./entities";
import { GooglePlace } from "./googlePlace";

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
  wouldReturn?: WouldReturnQuery;
}

export interface QueryResponse {
  places: IMongoPlace[];
  reviews: IReview[];
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