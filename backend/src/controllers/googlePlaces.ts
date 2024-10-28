import axios from 'axios';
import { Request, Response } from 'express';
import { searchRestaurantOnGooglePlaces } from '../utilities';
import { GooglePlacesResponse } from '../types';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

export const getRestaurantLocationHandler = async (req: Request, res: Response) => {
  const { restaurantName, location } = req.body;

  try {
    const placeData = await searchRestaurantOnGooglePlaces(restaurantName, location);
    res.json(placeData);
  } catch (error) {
    res.status(500).json({ error: 'Could not find restaurant information' });
  }
};

export const verifyLocationHandler = async (req: Request, res: Response): Promise<void> => {
  const { restaurantName, location } = req.body;

  try {
    const response = await axios.get<GooglePlacesResponse>('https://maps.googleapis.com/maps/api/place/textsearch/json', {
      params: {
        query: `${restaurantName} ${location}`,
        key: GOOGLE_PLACES_API_KEY,
      },
    });

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const place = response.data.results[0]; // Use the top result
      const placeDetails = {
        restaurantName: place.name,
        location: place.formatted_address,
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
      };

      res.json({ status: 'success', placeDetails });
    } else {
      res.json({ status: 'failure', message: 'Location not found.' });
    }
  } catch (error) {
    console.error('Error with Google Places API:', error);
    res.status(500).json({ status: 'error', message: 'An error occurred while verifying location.' });
  }
};
