import path from 'path';
import cors from 'cors';
import * as dotenv from 'dotenv';
import OpenAI from 'openai';
import express from 'express';
import { Server } from 'http';

import { connectDB } from './controllers/db';

import { queryReviewsHandler, previewReviewHandler, addReviewsFromFileHandler, chatReviewHandler, reviewsRouter, submitReviewHandler } from './controllers';

export let openai: OpenAI;

const createRoutes = (app: express.Application) => {
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

dotenv.config();

console.log('environment variables:');
console.log(process.env.OPENAI_API_KEY);
console.log(process.env.MONGODB_URI);
console.log(process.env.PORT);

connectDB();

const app: express.Application = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// createRoutes(app);
app.post('/api/query', queryReviewsHandler);
app.post('/api/reviews/preview', previewReviewHandler);
app.post('/api/reviews/chat', chatReviewHandler);
app.post('/api/reviews/submit', submitReviewHandler);
app.post('/api/reviews/addReviewsFromFile', addReviewsFromFileHandler);
app.use('/api/reviews', reviewsRouter);

openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const server: Server<any> = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

process.on('unhandledRejection', (err: any, promise: any) => {
  console.log(`Error: ${err.message}`);
  // Close server and exit process
  server.close(() => process.exit(1));
});

