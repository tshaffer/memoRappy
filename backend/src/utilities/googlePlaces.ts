import axios from 'axios';
import { GooglePlacesResponse, MemorappyPlaceResult } from '../types';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const GOOGLE_PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place/textsearch/json';

/**
 * Searches for a place using Google Places API based on restaurant name and location.
 * @param restaurantName - The name of the restaurant.
 * @param location - The location of the restaurant.
 * @returns - Information about the restaurant from Google Places.
 */
export const searchRestaurantOnGooglePlaces = async (restaurantName: string, location: string): Promise<MemorappyPlaceResult> => {
  const query = `${restaurantName} ${location}`;
  const url = `${GOOGLE_PLACES_BASE_URL}?query=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}`;

  console.log('searchRestaurantOnGooglePlaces', url);

  try {
    const response = await axios.get<GooglePlacesResponse>(url);
    const places: google.maps.places.PlaceResult[] = (response.data as { results: google.maps.places.PlaceResult[] }).results;

    if (places.length === 0) {
      throw new Error('No places found matching the query');
    }

    // Return the most relevant result
    const place: google.maps.places.PlaceResult = places[0];
    return {
      placeId: place.place_id!,
      name: place.name!,
      address: place.formatted_address,
      location: place.geometry!.location,
    };
  } catch (error) {
    console.error('Error with Google Places API:', error);
    throw error;
  }
};

