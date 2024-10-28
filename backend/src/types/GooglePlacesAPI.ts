// types/GooglePlacesAPI.ts

export interface GooglePlacesResponse {
  html_attributions: string[];
  results: PlaceResult[];
  status: string;
}

export interface PlaceResult {
  business_status?: string;
  formatted_address?: string;
  geometry: Geometry;
  icon?: string;
  name: string;
  opening_hours?: OpeningHours;
  place_id: string;
  rating?: number;
  user_ratings_total?: number;
  types?: string[];
  vicinity?: string;
  [key: string]: any; // For any other optional fields Google might return
}

export interface MemorappyPlaceResult {
  placeId: string;
  name: string;
  address: string | undefined;
  location: LatLngLiteral;
}

export interface Geometry {
  location: LatLngLiteral;
  viewport: Viewport;
}

export interface LatLngLiteral {
  lat: number;
  lng: number;
}

export interface Viewport {
  northeast: LatLngLiteral;
  southwest: LatLngLiteral;
}

export interface OpeningHours {
  open_now: boolean;
}
