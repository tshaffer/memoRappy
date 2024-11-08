import { GeoJSONPoint, LatLngLiteral, MemoRappGeometry, MemoRappPlace } from "../types";

export const getCityNameFromPlace = (place: MemoRappPlace): string => {

  const addressComponents = place.address_components;
  const cityComponent = addressComponents?.find((component: any) =>
    component.types.includes("locality")
  );
  const cityName: string = cityComponent ? cityComponent.long_name : ''
  return cityName;
}

export const getLatLngFromPlace = (place: MemoRappPlace): LatLngLiteral => {
  const geometry: MemoRappGeometry | undefined = place.geometry;
  const location: GeoJSONPoint | undefined = geometry?.location;
  const coordinates: number[] | undefined = location?.coordinates;
  const lat: number = coordinates ? coordinates[1] : 0;
  const lng: number = coordinates ? coordinates[0] : 0;
  return { lat, lng };
}