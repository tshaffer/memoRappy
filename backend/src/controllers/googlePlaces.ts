import { Request, Response } from 'express';
import { searchRestaurantOnGooglePlaces } from '../utilities';

export const getRestaurantLocationHandler = async (req: Request, res: Response) => {
  const { restaurantName, location } = req.body;

  try {
    const placeData = await searchRestaurantOnGooglePlaces(restaurantName, location);
    res.json(placeData);
  } catch (error) {
    res.status(500).json({ error: 'Could not find restaurant information' });
  }
};
