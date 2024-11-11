import axios from 'axios';
import { MongoGeometry, GoogleGeometry, MongoViewport, GeoJSONPoint } from '../types';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

export const getCoordinates = async (location: string): Promise<google.maps.LatLngLiteral | null> => {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json`;
    const response = await axios.get(url, {
      params: {
        query: location,
        key: GOOGLE_PLACES_API_KEY,
      },
    });

    const data: any = response.data;

    if (data.status === 'OK' && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      return { lat, lng };
    } else {
      console.warn('No results found for the specified location:', location);
      return null;
    }
  } catch (error) {
    console.error('Error retrieving coordinates:', error);
    return null;
  }
};

export const getMongoGeometryFromGoogleGeometry = (googleGeometry: GoogleGeometry): MongoGeometry => {
  const { lat, lng } = googleGeometry.location;
  const geoJSONLocation: GeoJSONPoint = {
    type: 'Point',
    coordinates: [lng, lat]
  };
  const mongoViewport: MongoViewport = convertViewport(googleGeometry.viewport.east, googleGeometry.viewport.north, googleGeometry.viewport.south, googleGeometry.viewport.west);
  const mongoGeometry: MongoGeometry = {
    location: geoJSONLocation,
    viewport: mongoViewport
  };
  return mongoGeometry;
}

const convertViewport = (east: number, north: number, south: number, west: number): MongoViewport => {
  const mongoViewport: MongoViewport = {
    northeast: {
      type: 'Point',
      coordinates: [east, north]
    },
    southwest: {
      type: 'Point',
      coordinates: [west, south]
    }
    // northeast: {
    //   lat: north,
    //   lng: east
    // },
    // southwest: {
    //   lat: south,
    //   lng: west
    // }
  }
  return mongoViewport;
};