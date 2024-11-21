import mongoose, { Schema, Document, Model } from 'mongoose';
import { MongoPlaceEntity } from '../types/mongoTypes';

export interface IMongoPlace extends Omit<MongoPlaceEntity, "_id">, Document { }

export type MongoPlaceModel = Model<IMongoPlace>;

const GeoJSONPointSchema: Schema = new Schema({
  type: {
    type: String,
    enum: ['Point'],
    required: true
  },
  coordinates: {
    type: [Number],
    required: true
  }
});

const MongoViewportSchema: Schema = new Schema({
  northeast: GeoJSONPointSchema,
  southwest: GeoJSONPointSchema
});

const MongoGeometrySchema: Schema = new Schema({
  location: GeoJSONPointSchema,
  location_type: { type: String },
  viewport: MongoViewportSchema
});

const MongoPlaceSchema: Schema = new Schema({
  place_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  address_components: { type: Array },
  formatted_address: { type: String, required: true },
  website: { type: String },
  geometry: MongoGeometrySchema
});

MongoPlaceSchema.index({ "geometry.location": "2dsphere" });

const MongoPlace: MongoPlaceModel = mongoose.model<IMongoPlace>('MongoPlace', MongoPlaceSchema);

export default MongoPlace;
