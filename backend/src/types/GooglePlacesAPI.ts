// types/GooglePlacesAPI.ts

import { AddressComponent, PlacePhoto, PlaceReview } from "./PlacesAPI";

export interface GooglePlacesResponse {
  html_attributions: string[];
  results: google.maps.places.PlaceResult[];
  status: google.maps.places.PlacesServiceStatus;
}

// Define the main response type for Place Details
export interface GooglePlaceDetailsResponse {
  html_attributions: string[];
  result: GooglePlaceDetails;
  status: string;
}

// Define the type for the 'result' object
export interface GooglePlaceDetails {
  address_components?: AddressComponent[];
  adr_address?: string;
  formatted_address?: string;
  formatted_phone_number?: string;
  geometry?: GoogleGeometry;
  icon?: string;
  name?: string;
  photos?: PlacePhoto[];
  place_id?: string;
  rating?: number;
  reviews?: PlaceReview[];
  types?: string[];
  url?: string;
  user_ratings_total?: number;
  website?: string;
  // Additional fields can be added as needed
}

export interface GoogleGeometry {
  location: google.maps.LatLngLiteral;
  viewport: google.maps.LatLngBoundsLiteral;
}

