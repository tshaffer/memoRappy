// Interface for a GeoJSON point, with type and coordinates
export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

// Types for nested properties
export interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
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
