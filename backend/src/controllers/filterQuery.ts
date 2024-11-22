import { Request, Response } from 'express';
import MongoPlace, { IMongoPlace } from '../models/MongoPlace';
import Review, { IReview } from '../models/Review';
import { FilterQueryParams, QueryResponse, PlacesReviewsCollection, GooglePlace, MemoRappReview } from '../types';
import { convertMongoPlacesToGooglePlaces } from '../utilities';
import ItemOrderedModel from '../models/ItemOrdered';

export const filterReviewsHandler = async (
  request: Request<{}, {}, FilterQueryParams>,
  response: Response
): Promise<void> => {
  const filterQueryResponse: QueryResponse = await getFilteredPlacesAndReviews(request.body);
  console.log('filterQueryResponse');
  console.log(filterQueryResponse);

  const { places, reviews } = filterQueryResponse;
  const googlePlaces: GooglePlace[] = convertMongoPlacesToGooglePlaces(places);
  const memoRappReviews: MemoRappReview[] = reviews.map((review: IReview) => {
    return review.toObject();
  });

  const filterResponse: PlacesReviewsCollection = {
    places: googlePlaces,
    reviews: memoRappReviews,
  };
  response.json(filterResponse);
}

const getFilteredPlacesAndReviews = async (queryParams: FilterQueryParams): Promise<QueryResponse> => {
  const { distanceAwayQuery, wouldReturn, itemsOrdered } = queryParams;
  const { lat, lng, radius } = distanceAwayQuery || {};

  try {
    // Step 0: Initialize queries
    let places: IMongoPlace[] = await MongoPlace.find({});
    let reviews: IReview[] = await Review.find({});
    const reviewQuery: any = {};

    // Step 1: Construct the Would Return filter for reviews
    if (wouldReturn) {
      const returnFilter: (boolean | null)[] = [];
      if (wouldReturn.yes) returnFilter.push(true);
      if (wouldReturn.no) returnFilter.push(false);
      if (wouldReturn.notSpecified) returnFilter.push(null);
      reviewQuery['structuredReviewProperties.wouldReturn'] = { $in: returnFilter };
    }

    // Step 2: Construct the Items Ordered filter
    if (itemsOrdered && itemsOrdered.length > 0) {
      const standardizedNames = await ItemOrderedModel.find({
        inputName: { $in: itemsOrdered },
      }).distinct('standardizedName');

      const relatedInputNames = await ItemOrderedModel.find({
        standardizedName: { $in: standardizedNames },
      }).distinct('inputName');

      if (relatedInputNames.length > 0) {
        reviewQuery['freeformReviewProperties.itemReviews'] = {
          $elemMatch: {
            item: { $in: relatedInputNames },
          },
        };
      }
    }

    // Step 3: Filter reviews based on the reviewQuery
    if (Object.keys(reviewQuery).length > 0) {
      reviews = await Review.find(reviewQuery);
    }

    // Extract unique place_ids from the filtered reviews
    const placeIdsWithReviews = Array.from(new Set(reviews.map((review) => review.place_id)));

    if (placeIdsWithReviews.length === 0) {
      return { places: [], reviews: [] }; // No matching reviews
    }

    // Step 4: Filter places based on distance or matching place IDs
    let placeQuery: any = { place_id: { $in: placeIdsWithReviews } };

    if (lat !== undefined && lng !== undefined && radius !== undefined) {
      placeQuery['geometry.location'] = {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: radius * 1609.34, // Convert miles to meters
        },
      };
    }

    places = await MongoPlace.find(placeQuery);

    // Step 5: Filter reviews to include only those belonging to the filtered places
    const filteredPlaceIds = places.map((place) => place.place_id);
    reviews = reviews.filter((review) => filteredPlaceIds.includes(review.place_id));

    // Combine results
    return { places, reviews };
  } catch (error) {
    console.error('Error retrieving filtered places and reviews:', error);
    throw new Error('Failed to retrieve filtered data.');
  }
};
