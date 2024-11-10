import mongoose from 'mongoose';

export let connection: mongoose.Connection;

export async function connectDB() {

  console.log('mongo uri is:');
  console.log(process.env.MONGODB_URI);
  mongoose.connect(process.env.MONGODB_URI || '')
    .then(() => console.log('Connected to MongoDB'))
    .catch((error) => console.error('Error connecting to MongoDB:', error));
  console.log(`MongoDB db connected`);

  mongoose.Promise = global.Promise;
};
