// types/GooglePlacesAPI.ts

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
  geometry?: Geometry;
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

// Types for nested properties
export interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
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

export interface PlacePhoto {
  height: number;
  width: number;
  html_attributions: string[];
  photo_reference: string;
}

export interface PlaceReview {
  author_name: string;
  author_url?: string;
  language: string;
  profile_photo_url?: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
}
