import axios from 'axios';
import { Request, Response } from 'express';
import { GooglePlacesResponse, GooglePlaceDetailsResponse, GooglePlaceDetails, MemoRappPlaceProperties, PlaceProperties } from '../types';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const GOOGLE_PLACES_URL = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
const GOOGLE_PLACE_DETAILS_BASE_URL = 'https://maps.googleapis.com/maps/api/place/details/json';

export const getRestaurantLocationHandler = async (req: Request, res: Response): Promise<void> => {
  const { restaurantName, location } = req.body;

  try {
    const placeData: PlaceProperties = await getRestaurantProperties(restaurantName, location);
    res.json(placeData);
  } catch (error) {
    res.status(500).json({ error: 'Could not find restaurant information' });
  }
};

export const getRestaurantProperties = async (restaurantName: string, location: string): Promise<PlaceProperties> => {

  const query = `${restaurantName} ${location}`;
  const url = `${GOOGLE_PLACES_URL}?query=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}`;

  try {
    const place: google.maps.places.PlaceResult = await getGooglePlace(url);
    console.log('Place:', place);

    const placeDetails: GooglePlaceDetails | null = await getGooglePlaceDetails(place!.place_id!);
    console.log('Place Details:', placeDetails);

    const restaurantProperties: PlaceProperties = getRestaurantPropertiesFromGoogleProperties(place, placeDetails!);
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

    console.log('Place:', place);

    return place;
  }
  catch (error) {
    console.error('Error with Google Places API:', error);
    throw error;
  }
}

const getGooglePlaceDetails = async (placeId: string): Promise<GooglePlaceDetails | null> => {
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
    return googlePlaceDetails;
  } catch (error) {
    console.error("Error fetching city name:", error);
    return null;
  }
}

const getRestaurantPropertiesFromGoogleProperties = (place: google.maps.places.PlaceResult, googlePlaceDetails: GooglePlaceDetails): PlaceProperties => {

  const placeDetails: MemoRappPlaceProperties = pickMemoRappPlaceDetails(googlePlaceDetails);

  const addressComponents = googlePlaceDetails.address_components;
  const cityComponent = addressComponents?.find((component: any) =>
    component.types.includes("locality")
  );
  const cityName: string | null = cityComponent ? cityComponent.long_name : null

  const placeProperties: PlaceProperties = {
    ...placeDetails,
    cityName,
    latitude: place.geometry!.location!.lat as unknown as number,
    longitude: place.geometry!.location!.lng as unknown as number,
  };
  
  return placeProperties;
}

// Dummy object to define the shape of MemoRappPlaceProperties at runtime
const memoRappPropertiesTemplate: MemoRappPlaceProperties = {
  place_id: '',
  formatted_address: '',
  name: '',
  website: '',
};

function pickMemoRappPlaceDetails(details: GooglePlaceDetails): MemoRappPlaceProperties {
  const keys = Object.keys(memoRappPropertiesTemplate) as (keyof MemoRappPlaceProperties)[];
  
  const result = Object.fromEntries(
    keys
      .filter(key => key in details)
      .map(key => [key, details[key]])
  ) as unknown as MemoRappPlaceProperties;

  return result;
}
