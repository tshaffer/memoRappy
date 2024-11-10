import fs from 'fs';
import path from 'path';
import { ParsedReviewProperties, SubmitReviewBody } from '../types/';
import { Request, Response } from 'express';
import { parsePreview, submitReview } from './addReview';

interface TestReview {
  restaurantName: string;
  dateOfVisit: string;
  wouldReturn: boolean | null;
  reviewText: string;
};

const generateSessionId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

const addReview = async (restaurantName: string, dateOfVisit: string, wouldReturn: boolean | null, reviewText: string): Promise<void> => {
  const sessionId: string = generateSessionId();
  const parsedReviewProperties: ParsedReviewProperties = await parsePreview(sessionId, restaurantName, reviewText);

  console.log('Parsed review properties for ' + restaurantName + ':', parsedReviewProperties);
  console.log('Location of ' + restaurantName + ':', parsedReviewProperties.place);

  const body: SubmitReviewBody = {
    structuredReviewProperties: {
      restaurantName,
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
  console.log("Project root:", projectRoot);
  const reviewsFilePath = path.join(projectRoot, 'testData', fileName);
  console.log("Reviews file path:", reviewsFilePath);

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
