import axios from 'axios';
import { Request, Response } from 'express';
import { GooglePlacesResponse } from '../types';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const GOOGLE_PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place/textsearch/json';

export const getRestaurantLocationHandler = async (req: Request, res: Response): Promise<void> => {
  const { restaurantName, location } = req.body;

  try {
    const placeData = await getRestaurantLocation(restaurantName, location);
    res.json(placeData);
  } catch (error) {
    res.status(500).json({ error: 'Could not find restaurant information' });
  }
};

const getRestaurantLocation = async (restaurantName: string, location: string): Promise<google.maps.places.PlaceResult> => {
  const query = `${restaurantName} ${location}`;
  const url = `${GOOGLE_PLACES_BASE_URL}?query=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}`;
  try {
    const response = await axios.get<GooglePlacesResponse>(url);
    const places: google.maps.places.PlaceResult[] = (response.data as { results: google.maps.places.PlaceResult[] }).results;
    if (places.length === 0) {
      throw new Error('No places found matching the query');
    }
    // Return the most relevant result
    const place: google.maps.places.PlaceResult = places[0];
    return place;

  } catch (error) {
    console.error('Error with Google Places API:', error);
    throw error;
  }
};
