import fs from 'fs';
import path from 'path';
import { ParsedReviewProperties, SubmitReviewBody } from '../types/';
import { Request, Response } from 'express';
import { parsePreview, submitReview } from './addReview';

interface TestReview {
  restaurantName: string;
  userLocation: string;
  dateOfVisit: string;
  reviewText: string;
};

const generateSessionId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

const addReview = async (restaurantName: string, userLocation: string, dateOfVisit: string, reviewText: string): Promise<void> => {
  const sessionId: string = generateSessionId();
  const parsedReviewProperties: ParsedReviewProperties = await parsePreview(sessionId, restaurantName, userLocation ? userLocation : '', reviewText);

  console.log('Parsed review properties for ' + restaurantName + ':', parsedReviewProperties);
  console.log('Location of ' + restaurantName + ':', parsedReviewProperties.place);

  const body: SubmitReviewBody = {
    structuredReviewProperties: {
      restaurantName,
      userLocation,
      dateOfVisit,
    },
    parsedReviewProperties,
    reviewText,
    sessionId,
  };
  await submitReview(body);
}

export const addReviewsHandler = async (request: Request, response: Response, next: any): Promise<any> => {

  const projectRoot = process.cwd();
  console.log("Project root:", projectRoot);
  const reviewsFilePath = path.join(projectRoot, 'testData', 'reviews.json');
  console.log("Reviews file path:", reviewsFilePath);

  try {
    const data = fs.readFileSync(reviewsFilePath, 'utf8');
    const reviews: TestReview[] = JSON.parse(data);

    for (const review of reviews) {
      const { restaurantName, userLocation, reviewText, dateOfVisit } = review;
      await addReview(restaurantName, userLocation, dateOfVisit, reviewText);
      // console.log('Review loaded:');
    }
    return response.status(200).json({ message: "Reviews loaded successfully!" });
  } catch (error) {
    console.error("Error adding reviews:", error);
    return response.status(500).json({ error: "Error adding reviews" });
  }
};
