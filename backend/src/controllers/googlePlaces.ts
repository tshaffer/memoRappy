import axios from 'axios';
import { Request, Response } from 'express';
import { GooglePlacesResponse, GoogleLocation, GooglePlaceDetailsResponse, GooglePlaceDetails } from '../types';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const GOOGLE_PLACES_URL = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
const GOOGLE_PLACE_DETAILS_BASE_URL = 'https://maps.googleapis.com/maps/api/place/details/json';

export const getRestaurantLocationHandler = async (req: Request, res: Response): Promise<void> => {
  const { restaurantName, location } = req.body;

  try {
    const placeData = await getRestaurantProperties(restaurantName, location);
    res.json(placeData);
  } catch (error) {
    res.status(500).json({ error: 'Could not find restaurant information' });
  }
};

export const getRestaurantProperties = async (restaurantName: string, location: string): Promise<GoogleLocation> => {

  const query = `${restaurantName} ${location}`;
  const url = `${GOOGLE_PLACES_URL}?query=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}`;

  try {
    const place: google.maps.places.PlaceResult = await getGooglePlace(url);
    console.log('Place:', place);

    const placeDetails: GooglePlaceDetails | null = await getGooglePlaceDetails(place!.place_id!);
    console.log('Place Details:', placeDetails);

    const restaurantProperties: GoogleLocation = getRestaurantPropertiesFromGoogleProperties(place, placeDetails!);
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
    // const addressComponents = response.data.result.address_components;
    // const cityComponent = addressComponents.find((component: any) =>
    //   component.types.includes("locality")
    // );

    // return cityComponent ? cityComponent.long_name : null;
  } catch (error) {
    console.error("Error fetching city name:", error);
    return null;
  }
}

const getRestaurantPropertiesFromGoogleProperties = (place: google.maps.places.PlaceResult, placeDetails: GooglePlaceDetails): GoogleLocation => {

  const addressComponents = placeDetails.address_components;
  const cityComponent = addressComponents?.find((component: any) =>
    component.types.includes("locality")
  );

  const locationInfo: GoogleLocation = {
    place_id: place.place_id,
    name: place.name,
    address: place.formatted_address,
    cityName: cityComponent ? cityComponent.long_name : null,
    latitude: place.geometry!.location!.lat as unknown as number,
    longitude: place.geometry!.location!.lng as unknown as number,
  };

  return locationInfo;
}

