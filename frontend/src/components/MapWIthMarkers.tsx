import React, { useState, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { GoogleLocation } from '../types';

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

// Component to render a map with current location and destination markers
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

  // Center the map either on the user's location or the first location in the list
  const mapCenter = currentLocation || (locations[0] && { lat: locations[0].latitude, lng: locations[0].longitude });

  return (
    <LoadScript googleMapsApiKey={''}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={mapCenter}
        options={initialMapOptions}
      >
        {currentLocation && (
          <Marker position={currentLocation} label="You" />
        )}

        {locations.map((location, index) => (
          <Marker
            key={index}
            position={{ lat: location.latitude, lng: location.longitude }}
            label={location.name || `Location ${index + 1}`}
          />
        ))}
      </GoogleMap>
    </LoadScript>
  );
};

export default MapWithMarkers;
