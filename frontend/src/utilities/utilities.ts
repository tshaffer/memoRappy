import { LatLngLiteral, MemoRappPlace } from "../types";

export const getCityNameFromPlace = (place: MemoRappPlace): string => {

  const addressComponents = place.address_components;
  const cityComponent = addressComponents?.find((component: any) =>
    component.types.includes("locality")
  );
  const cityName: string = cityComponent ? cityComponent.long_name : ''
  return cityName;
}

export const getLatLngFromPlace = (place: MemoRappPlace): LatLngLiteral => {
  const lat = place.geometry!.location.lat;
  const lng = place.geometry!.location.lng;
  return { lat, lng };
}