import { AddressComponent, PlacePhoto, PlaceReview, GeoJSONPoint } from "./PlacesAPI";

export interface MemoRappPlaceDetails {
  address_components?: AddressComponent[];
  adr_address?: string;
  formatted_address?: string;
  formatted_phone_number?: string;
  geometry?: MongoGeometry;
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
}

// Interface for Geometry, including the location and viewport
export interface MongoGeometry {
  location: GeoJSONPoint;
  location_type?: string;
  viewport: MongoViewport;
}

// Interface for Viewport, with northeast and southwest bounds
export interface MongoViewport {
  northeast: GeoJSONPoint;
  southwest: GeoJSONPoint;
}

