import React, { useState, useEffect } from 'react';
// import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { GoogleLocation } from '../types';
import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';

// Define the map container style and initial options
const mapContainerStyle = { width: '100%', height: '500px' };
const initialMapOptions = { zoom: 14 };

interface Coordinates {
  lat: number;
  lng: number;
}

interface MapWithMarkersProps {
  locations: GoogleLocation[];
}

const MapWithMarkers: React.FC<MapWithMarkersProps> = ({ locations }) => {
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);

  // Fetch the user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => console.error("Error getting current location: ", error),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const googleMapsApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY!;

  return (
    <APIProvider apiKey={googleMapsApiKey}>
      <Map
        style={{ width: '100vw', height: '100vh' }}
        zoom={12}
        center={{ lat: 37.3944829, lng: -122.0790619 }}
        // center={{ lat: currentLocation!.lat, lng: currentLocation!.lng }}
      >
        <Marker position={{ lat: 37.3944829, lng: -122.0790619 }} />
        <Marker position={{ lat: 37.3974265, lng: -122.0611825 }} />
        {/* <Marker position={{ lat: currentLocation!.lat, lng:currentLocation!.lng }} /> */}
      </Map>
    </APIProvider>);
  /*
    return (
      <APIProvider apiKey={googleMapsApiKey}>
        <Map
          style={{ width: '100vw', height: '100vh' }}
          defaultCenter={{ lat: 22.54992, lng: 0 }}
          defaultZoom={3}
          gestureHandling={'greedy'}
          disableDefaultUI={true}
        />
      </APIProvider>
    );
  */
};

export default MapWithMarkers;
