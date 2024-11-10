import cors from 'cors';
import * as dotenv from 'dotenv';
import OpenAI from 'openai';
import express from 'express';
import { Server } from 'http';

import { connectDB } from './controllers/db';

import { createRoutes } from './controllers';

export let openai: OpenAI;

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

createRoutes(app);

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
