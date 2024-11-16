import { Request, Response } from 'express';
import MongoPlace, { IMongoPlace } from "../models/MongoPlace";
import { GoogleGeometry, GooglePlace, GooglePlaceResult, MongoGeometry, MongoPlaceEntity } from "../types";
import { getMongoGeometryFromGoogleGeometry } from "./googlePlaces";
import { convertMongoPlacesToGooglePlaces } from '../utilities';

export const getPlaces = async (request: Request, response: Response, next: any) => {
  try {
    const mongoPlaces: IMongoPlace[] = await MongoPlace.find({}).exec();
    const googlePlaces: GooglePlace[] = convertMongoPlacesToGooglePlaces(mongoPlaces);
    console.log('googlePlaces:', googlePlaces);
    response.status(200).json({ googlePlaces });
    return;
  } catch (error) {
    console.error('Error retrieving reviews:', error);
    response.status(500).json({ error: 'An error occurred while retrieving the reviews.' });
    return;
  }
}

export const addPlace = async (googlePlace: GooglePlaceResult): Promise<IMongoPlace | null> => {
  // Convert Google geometry to MongoDB format
  const mongoGeometry: MongoGeometry = getMongoGeometryFromGoogleGeometry(googlePlace.geometry!);
  const mongoPlace: MongoPlaceEntity = { ...googlePlace, geometry: mongoGeometry };

  const newMongoPlace: IMongoPlace = new MongoPlace(mongoPlace);

  try {
    const savedMongoPlace: IMongoPlace | null = await newMongoPlace.save();
    return savedMongoPlace;
  } catch (error: any) {
    // Check for duplicate key error (E11000 duplicate key error index)
    if (error.code === 11000 && error.keyPattern?.place_id) {
      console.log("Place already exists in the database.");
      const existingPlace = await MongoPlace.findOne({ place_id: googlePlace.place_id });
      return existingPlace;
    } else {
      console.error('Error saving place:', error);
      throw new Error('An error occurred while saving the place.');
    }
  }
}

export function convertMongoGeometryToGoogleGeometry(mongoGeometry: MongoGeometry): GoogleGeometry {
  return {
    location: {
      lat: mongoGeometry.location.coordinates[1], // GeoJSON uses [lng, lat]
      lng: mongoGeometry.location.coordinates[0]
    },
    viewport: {
      north: mongoGeometry.viewport.northeast.coordinates[1],
      south: mongoGeometry.viewport.southwest.coordinates[1],
      east: mongoGeometry.viewport.northeast.coordinates[0],
      west: mongoGeometry.viewport.southwest.coordinates[0]
    }
  };
}
