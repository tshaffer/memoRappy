import path from 'path';
import express from 'express';
import { previewReviewHandler, chatReviewHandler, submitReviewHandler } from './addReview';
import { addReviewsFromFileHandler } from './loadReviews';
import { queryReviewsHandler } from './queryReviews';
import { reviewsRouter } from './reviews';

export const createRoutes = (app: express.Application) => {
  app.post('/api/query', queryReviewsHandler);
  app.post('/api/reviews/preview', previewReviewHandler);
  app.post('/api/reviews/chat', chatReviewHandler);
  app.post('/api/reviews/submit', submitReviewHandler);
  app.post('/api/reviews/addReviewsFromFile', addReviewsFromFileHandler);
  app.use('/api/reviews', reviewsRouter);

  // Serve static files from the frontend build directory, adjusted for production
  const frontendPath = process.env.NODE_ENV === 'production'
    ? path.join(__dirname, '../../frontend/build') // Adjusted for Heroku
    : path.join(__dirname, '../frontend/build');   // Works for local development

  console.log('frontend build directory:', frontendPath);

  // Serve static files from the adjusted path
  app.use(express.static(frontendPath));

  // All other requests to serve index.html
  app.get('*', (req: any, res: any) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });


}
