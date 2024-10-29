// types/GooglePlacesAPI.ts

export interface GooglePlacesResponse {
  html_attributions: string[];
  results: google.maps.places.PlaceResult[];
  status: google.maps.places.PlacesServiceStatus;
}

export interface MemorappyPlaceResult {
  placeId: string;
  name: string;
  address: string | undefined;
  location: google.maps.LatLng | undefined;
}

export interface OpeningHours {
  open_now: boolean;
}
