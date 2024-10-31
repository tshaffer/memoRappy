import { Request, Response } from 'express';
import Review from "../models/Review";

// Get all reviews or filter by query parameters
export const reviewsRouter = async (req: Request, res: Response) => {
  try {
    const { restaurantName, location, startDate, endDate, item } = req.query;

    // Build a dynamic query based on the provided filters
    const query: any = {};

    if (restaurantName) {
      query.restaurantName = new RegExp(restaurantName as string, 'i'); // Case-insensitive search
    }

    if (location) {
      query.location = new RegExp(location as string, 'i'); // Case-insensitive search
    }

    // Use the raw ISO date strings for date filtering
    if (startDate && endDate) {
      query.dateOfVisit = {
        $gte: startDate as string,
        $lte: endDate as string,
      };
    } else if (startDate) {
      query.dateOfVisit = { $gte: startDate as string };
    }

    if (item) {
      query.itemsOrdered = { $in: [new RegExp(item as string, 'i')] }; // Find if item exists in the list
    }

    // Query the MongoDB database for matching reviews
    const reviews = await Review.find(query).exec();
    res.status(200).json({ reviews });
  } catch (error) {
    console.error('Error retrieving reviews:', error);
    res.status(500).json({ error: 'An error occurred while retrieving the reviews.' });
  }
};
