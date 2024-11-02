import axios from 'axios';
import { Request, Response } from 'express';
import { GooglePlacesResponse, GoogleLocation } from '../types';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const GOOGLE_PLACES_URL = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
const GOOGLE_PLACE_DETAILS_BASE_URL ='https://maps.googleapis.com/maps/api/place/details/json';

export const getRestaurantLocationHandler = async (req: Request, res: Response): Promise<void> => {
  const { restaurantName, location } = req.body;

  try {
    const placeData = await getRestaurantLocation(restaurantName, location);
    res.json(placeData);
  } catch (error) {
    res.status(500).json({ error: 'Could not find restaurant information' });
  }
};

export const getRestaurantLocation = async (restaurantName: string, location: string): Promise<GoogleLocation> => {
  const query = `${restaurantName} ${location}`;
  const url = `${GOOGLE_PLACES_URL}?query=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}`;
  try {
    const response = await axios.get<GooglePlacesResponse>(url);
    const places: google.maps.places.PlaceResult[] = (response.data as { results: google.maps.places.PlaceResult[] }).results;
    if (places.length === 0) {
      throw new Error('No places found matching the query');
    }
    // Return the most relevant result
    const place: google.maps.places.PlaceResult = places[0];

    console.log('Place:', place);

    const cityName = await getCityName(place!.place_id!, GOOGLE_PLACES_API_KEY!);
    console.log('City name:', cityName);

    const locationInfo: GoogleLocation = {
      place_id: place.place_id,
      name: place.name,
      address: place.formatted_address,
      cityName,
      latitude: place.geometry!.location!.lat as unknown as number,
      longitude: place.geometry!.location!.lng as unknown as number,
    };

    return locationInfo;

  } catch (error) {
    console.error('Error with Google Places API:', error);
    throw error;
  }
};

async function getCityName(placeId: string, apiKey: string): Promise<string | null> {
  try {
    const response: any = await axios.get(
      `https://maps.googleapis.com/maps/api/place/details/json`,
      {
        params: {
          place_id: placeId,
          key: apiKey,
        },
      }
    );

    console.log('getCityName response:', response.data);
    
    const addressComponents = response.data.result.address_components;
    const cityComponent = addressComponents.find((component: any) =>
      component.types.includes("locality")
    );

    return cityComponent ? cityComponent.long_name : null;
  } catch (error) {
    console.error("Error fetching city name:", error);
    return null;
  }
}
