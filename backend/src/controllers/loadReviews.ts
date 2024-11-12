import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { GooglePlaceResult, GooglePlacesResponse, ParsedReviewProperties, SubmitReviewBody } from '../types/';
import { Request, Response } from 'express';
import { parsePreview, submitReview } from './manageReview';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const GOOGLE_PLACES_URL = 'https://maps.googleapis.com/maps/api/place/textsearch/json';

interface TestReview {
  restaurantName: string;
  dateOfVisit: string;
  wouldReturn: boolean | null;
  reviewText: string;
};

const generateSessionId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

const addReview = async (restaurantName: string, dateOfVisit: string, wouldReturn: boolean | null, reviewText: string): Promise<void> => {
  const sessionId: string = generateSessionId();
  const parsedReviewProperties: ParsedReviewProperties = await parsePreview(sessionId, reviewText);
  const place: GooglePlaceResult = await getRestaurantProperties(restaurantName);
  const body: SubmitReviewBody = {
    structuredReviewProperties: {
      googlePlace: place,
      dateOfVisit,
      wouldReturn,
    },
    parsedReviewProperties,
    reviewText,
    sessionId,
  };
  await submitReview(body);
}

interface AddReviewFromFileBody {
  fileName: string;
}

export const addReviewsFromFileHandler = async (
  request: Request<{}, {}, AddReviewFromFileBody>,
  response: Response
): Promise<void> => {

  const { fileName } = request.body;

  const projectRoot = process.cwd();
  const reviewsFilePath = path.join(projectRoot, 'testData', fileName);

  try {
    const data = fs.readFileSync(reviewsFilePath, 'utf8');
    const reviews: TestReview[] = JSON.parse(data);

    for (const review of reviews) {
      const { restaurantName, reviewText, dateOfVisit, wouldReturn } = review;
      await addReview(restaurantName, dateOfVisit, wouldReturn, reviewText);
      console.log('review added for ' + restaurantName);
    }
    console.log('All reviews loaded:');
    response.status(200).json({ message: "Reviews loaded successfully!" });
  } catch (error) {
    console.error("Error adding reviews:", error);
    response.status(500).json({ error: "Error adding reviews" });
  }
}

export const getRestaurantProperties = async (restaurantName: string): Promise<GooglePlaceResult> => {

  const location = '';
  const query = `${restaurantName} ${location}`;
  const url = `${GOOGLE_PLACES_URL}?query=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}`;

  try {
    const place: google.maps.places.PlaceResult = await getGooglePlace(url);
    const restaurantProperties: GooglePlaceResult = pickGooglePlaceProperties(place!)
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
    return place;
  }
  catch (error) {
    console.error('Error with Google Places API:', error);
    throw error;
  }
}

function pickGooglePlaceProperties(googlePlaceResult: google.maps.places.PlaceResult): GooglePlaceResult {

  const googlePlace: GooglePlaceResult = {
    place_id: googlePlaceResult.place_id!,
    name: googlePlaceResult.name!,
    address_components: googlePlaceResult.address_components,
    formatted_address: googlePlaceResult.formatted_address!,
    geometry: {
      location: {
        lat: googlePlaceResult.geometry!.location!.lat as unknown as number,
        lng: googlePlaceResult.geometry!.location!.lng as unknown as number,
      },
      viewport: {
        east: (googlePlaceResult.geometry!.viewport! as any).northeast.lat,
        north: (googlePlaceResult.geometry!.viewport! as any).northeast.lng,
        south: (googlePlaceResult.geometry!.viewport! as any).southwest.lat,
        west: (googlePlaceResult.geometry!.viewport! as any).southwest.lng,
      },
    },
    website: googlePlaceResult.website || '',
  };
  return googlePlace;
}
