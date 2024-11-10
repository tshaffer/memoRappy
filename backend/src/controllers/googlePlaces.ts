import axios from 'axios';
import { GooglePlacesResponse, GooglePlaceDetailsResponse, GooglePlaceDetails, MemoRappPlace, GeoJSONPoint, MemoRappPlaceDetails, MemoRappGeometry, LatLngLiteral } from '../types';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const GOOGLE_PLACES_URL = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
const GOOGLE_PLACE_DETAILS_BASE_URL = 'https://maps.googleapis.com/maps/api/place/details/json';

export const getCoordinates = async (location: string): Promise<LatLngLiteral | null> => {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json`;
    const response = await axios.get(url, {
      params: {
        query: location,
        key: GOOGLE_PLACES_API_KEY,
      },
    });

    const data: any = response.data;

    if (data.status === 'OK' && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      return { lat, lng };
    } else {
      console.warn('No results found for the specified location:', location);
      return null;
    }
  } catch (error) {
    console.error('Error retrieving coordinates:', error);
    return null;
  }
};

export const getRestaurantProperties = async (restaurantName: string): Promise<MemoRappPlace> => {

  const location = '';
  const query = `${restaurantName} ${location}`;
  const url = `${GOOGLE_PLACES_URL}?query=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}`;

  try {
    const place: google.maps.places.PlaceResult = await getGooglePlace(url);
    // console.log('google.maps.places.PlaceResult for ' + restaurantName + ':', place);

    const placeDetails: MemoRappPlaceDetails | null = await getMemoRappPlaceDetails(place!.place_id!);
    console.log('Place Details:', placeDetails);

    const restaurantProperties: MemoRappPlace = pickMemoRappPlaceDetails(placeDetails!)
    return restaurantProperties;

  } catch (error) {
    console.error('Error with Google Places API:', error);
    throw error;
  }
};

const getGooglePlace = async (url: string): Promise<google.maps.places.PlaceResult> => {

  try {
    const response = await axios.get<GooglePlacesResponse>(url);
    const places: google.maps.places.PlaceResult[] = (response.data as { results: google.maps.places.PlaceResult[] }).results;
    if (places.length === 0) {
      throw new Error('No places found matching the query');
    }
    // Return the most relevant result
    const place: google.maps.places.PlaceResult = places[0];

    // console.log('Place:', place);

    return place;
  }
  catch (error) {
    console.error('Error with Google Places API:', error);
    throw error;
  }
}

function convertToGeoJSON(placeDetails: GooglePlaceDetails): GeoJSONPoint | null {
  if (!placeDetails.geometry || !placeDetails.geometry.location) {
    console.error('No location data available in place details');
    return null;
  }

  const { lat, lng } = placeDetails.geometry.location;
  return {
    type: 'Point',
    coordinates: [lng, lat] // Note: GeoJSON uses [longitude, latitude] order
  };
}

const getMemoRappPlaceDetails = async (placeId: string): Promise<MemoRappPlaceDetails | null> => {
  try {
    const response: any = await axios.get(
      GOOGLE_PLACE_DETAILS_BASE_URL,
      {
        params: {
          place_id: placeId,
          key: GOOGLE_PLACES_API_KEY,
        },
      }
    );

    console.log('getPlaceResult response:', response.data);

    const placeDetailsResponse: GooglePlaceDetailsResponse = response.data;
    const googlePlaceDetails: GooglePlaceDetails = placeDetailsResponse.result;

    const geoJSONLocation: GeoJSONPoint = convertToGeoJSON(googlePlaceDetails)!;
    console.log(geoJSONLocation); // { type: 'Point', coordinates: [-122.4194, 37.7749] }
    const memoRappGeometry: MemoRappGeometry = {
      location: geoJSONLocation,
      viewport: googlePlaceDetails.geometry!.viewport
    };
    const memoRappPlaceDetails: MemoRappPlaceDetails = {
      ...googlePlaceDetails,
      geometry: memoRappGeometry,
    };
    return memoRappPlaceDetails;
  } catch (error) {
    console.error("Error fetching city name:", error);
    return null;
  }
}

// Dummy object to define the shape of MemoRappPlace at runtime
const memoRappPlaceTemplate: MemoRappPlace = {
  place_id: '',
  name: '',
  address_components: [],
  formatted_address: '',
  geometry: {
    location: {
      type: 'Point',
      coordinates: [0, 0]
    },
    viewport: {
      northeast: {
        type: 'Point',
        coordinates: [0, 0]
      },
      southwest: {
        type: 'Point',
        coordinates: [0, 0]
      }
    }
  },
  website: '',
};

function pickMemoRappPlaceDetails(details: MemoRappPlaceDetails): MemoRappPlace {
  const keys = Object.keys(memoRappPlaceTemplate) as (keyof MemoRappPlace)[];

  const result = Object.fromEntries(
    keys
      .filter(key => key in details)
      .map(key => [key, details[key]])
  ) as unknown as MemoRappPlace;

  return result;
}
