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

export interface MemoRappPlaceDetails {
  address_components?: AddressComponent[];
  adr_address?: string;
  formatted_address?: string;
  formatted_phone_number?: string;
  geometry?: MemoRappGeometry;
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

export interface GoogleGeometry {
  location: LatLngLiteral;
  viewport: Viewport;
}

// Interface for Geometry, including the location and viewport
export interface MemoRappGeometry {
  location: GeoJSONPoint;
  location_type?: string;
  viewport: Viewport;
}


// Interface for a GeoJSON point, with type and coordinates
export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

// Interface for Viewport, with northeast and southwest bounds
export interface Viewport {
  northeast: GeoJSONPoint;
  southwest: GeoJSONPoint;
}

export interface LatLngLiteral {
  lat: number;
  lng: number;
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

export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}
