import { GooglePlaceResult, MemoRappReview } from "./entities";

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

export interface FilterQueryParams {
  lat?: number;
  lng?: number;
  radius?: number;
  wouldReturn?: { yes: boolean; no: boolean; notSpecified: boolean };
}

// export interface FilterQueryResponse {
//   places: IMongoPlace[];
//   reviews: IReview[];
// }

export interface FilterResponse {
  places: GooglePlaceResult[];
  reviews: MemoRappReview[];
}

export interface WouldReturnQuery {
  yes: boolean;
  no: boolean;
  notSpecified: boolean;
}