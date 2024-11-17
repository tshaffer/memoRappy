import { GoogleGeometry, GooglePlace } from "../types";

export const getCityNameFromPlace = (place: GooglePlace): string => {
  const addressComponents = place.address_components;
  const cityComponent = addressComponents?.find((component: any) =>
    component.types.includes("locality")
  );
  const cityName: string = cityComponent ? cityComponent.long_name : ''
  return cityName;
}

export const getLatLngFromPlace = (place: GooglePlace): google.maps.LatLngLiteral => {
  const geometry: GoogleGeometry | undefined = place.geometry;
  const location: google.maps.LatLngLiteral = geometry?.location!;
  return location;
}

// Dummy object to define the shape of GooglePlace at runtime
// const googlePlaceTemplate: GooglePlace = {
//   place_id: '',
//   name: '',
//   address_components: [],
//   formatted_address: '',
//   geometry: {
//     location: { lat: 0, lng: 0 },
//     viewport: { east: 0, north: 0, south: 0, west: 0 },
//   },
//   website: '',
// };

export function pickGooglePlaceProperties(googlePlaceResult: google.maps.places.PlaceResult): GooglePlace {

  const googlePlace: GooglePlace = {
    place_id: googlePlaceResult.place_id!,
    name: googlePlaceResult.name!,
    address_components: googlePlaceResult.address_components,
    formatted_address: googlePlaceResult.formatted_address!,
    geometry: {
      location: {
        lat: googlePlaceResult.geometry!.location!.lat(),
        lng: googlePlaceResult.geometry!.location!.lng()
      },
      viewport: {
        east: googlePlaceResult.geometry!.viewport!.getNorthEast().lng(),
        north: googlePlaceResult.geometry!.viewport!.getNorthEast().lat(),
        south: googlePlaceResult.geometry!.viewport!.getSouthWest().lat(),
        west: googlePlaceResult.geometry!.viewport!.getSouthWest().lng(),
      },
    },
    website: googlePlaceResult.website || '',
  };
  return googlePlace;

  // const keys = Object.keys(googlePlaceTemplate) as (keyof GooglePlace)[];

  // const result = Object.fromEntries(
  //   keys
  //     .filter(key => key in googlePlaceResult)
  //     .map(key => [key, googlePlaceResult[key]])
  // ) as unknown as GooglePlace;

  // return result;

}
