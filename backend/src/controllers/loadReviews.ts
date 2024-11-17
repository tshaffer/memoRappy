import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { Request, Response } from 'express';
import { FreeformReviewProperties, GooglePlaceDetails, GooglePlaceDetailsResponse, GooglePlace, GooglePlacesResponse, MemoRappReview, StructuredReviewProperties } from '../types';
import { parsePreview } from './manageReview';
import { addPlace } from './places';
import { IMongoPlace, IReview } from '../models';
import { addReview } from './reviews';
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const GOOGLE_PLACES_URL = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
const GOOGLE_PLACE_DETAILS_BASE_URL = 'https://maps.googleapis.com/maps/api/place/details/json';

interface TestReview {
  restaurantName: string;
  dateOfVisit: string;
  wouldReturn: boolean | null;
  reviewText: string;
};

const generateSessionId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

const addTestReview = async (restaurantName: string, dateOfVisit: string, wouldReturn: boolean | null, reviewText: string): Promise<void> => {
  const sessionId: string = generateSessionId();

  const freeformReviewProperties: FreeformReviewProperties = await parsePreview(sessionId, reviewText);
  console.log('freeformReviewProperties:', freeformReviewProperties);

  const place: GooglePlace = await getRestaurantProperties(restaurantName);
  console.log('place:', place);

  const newMongoPlace: IMongoPlace | null = await addPlace(place);
  console.log('newMongoPlace:', newMongoPlace?.toObject());

  const placeId: string = place.place_id;
  const addReviewBody: MemoRappReview = {
    place_id: placeId,
    structuredReviewProperties: {
      dateOfVisit,
      wouldReturn,
    },
    freeformReviewProperties: freeformReviewProperties,
  };
  const newReview: IReview | null = await addReview(addReviewBody);
  console.log('newReview:', newReview?.toObject());

  return Promise.resolve();
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
      await addTestReview(restaurantName, dateOfVisit, wouldReturn, reviewText);
      console.log('review added for ' + restaurantName);
    }
    console.log('All reviews loaded:');
    response.status(200).json({ message: "Reviews loaded successfully!" });
  } catch (error) {
    console.error("Error adding reviews:", error);
    response.status(500).json({ error: "Error adding reviews" });
  }
}

export const getRestaurantProperties = async (restaurantName: string): Promise<GooglePlace> => {

  const location = '';
  const query = `${restaurantName} ${location}`;
  const url = `${GOOGLE_PLACES_URL}?query=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}`;

  try {
    const place: google.maps.places.PlaceResult = await getGooglePlace(url);
    const placeDetails: GooglePlaceDetails | null = await getGooglePlaceDetails(place!.place_id!);
    const restaurantProperties: GooglePlace = pickGooglePlaceProperties(placeDetails!)
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

const pickGooglePlaceProperties = (googlePlaceDetails: GooglePlaceDetails): GooglePlace => {
  const googlePlace: GooglePlace = {
    place_id: googlePlaceDetails.place_id!,
    name: googlePlaceDetails.name!,
    address_components: googlePlaceDetails.address_components,
    formatted_address: googlePlaceDetails.formatted_address!,
    geometry: {
      location: {
        lat: googlePlaceDetails.geometry!.location!.lat as unknown as number,
        lng: googlePlaceDetails.geometry!.location!.lng as unknown as number,
      },
      viewport: {
        east: (googlePlaceDetails.geometry!.viewport! as any).northeast.lat,
        north: (googlePlaceDetails.geometry!.viewport! as any).northeast.lng,
        south: (googlePlaceDetails.geometry!.viewport! as any).southwest.lat,
        west: (googlePlaceDetails.geometry!.viewport! as any).southwest.lng,
      },
    },
    website: googlePlaceDetails.website || '',
  };
  return googlePlace;
}
