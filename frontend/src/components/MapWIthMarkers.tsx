import React, { useState, useEffect } from 'react';
import { GoogleLocation } from '../types';
import { AdvancedMarker, APIProvider, Map, Marker, Pin } from '@vis.gl/react-google-maps';

interface Coordinates {
  lat: number;
  lng: number;
}

interface MapWithMarkersProps {
  locations: GoogleLocation[];
}

const DEFAULT_CENTER = { lat: 37.3944829, lng: -122.0790619 };
const DEFAULT_ZOOM = 14;

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

  const CustomBlueDot = () => (
    <div style={{
      width: '16px',
      height: '16px',
      backgroundColor: '#4285F4',  // Google blue color
      borderRadius: '50%',
      border: '2px solid #FFFFFF',  // White border
      boxShadow: '0 0 8px rgba(66, 133, 244, 0.5)',  // Shadow for emphasis
    }} />
  );

  const googleMapsApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY!;

  return (
    <APIProvider
      apiKey={googleMapsApiKey}
      version="beta">
      <div slot="main">
        <Map
          style={{ width: '100vw', height: '100vh' }}
          id="gmap"
          mapId="1ca0b6526e7d4819"
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          gestureHandling="none"
          fullscreenControl={false}
          zoomControl={false}>
          <AdvancedMarker position={{ lat: 37.3944829, lng: -122.0790619 }} />
          <AdvancedMarker position={{ lat: 37.3974265, lng: -122.0611825 }} />
          {currentLocation && (
            <AdvancedMarker position={currentLocation}>
              <CustomBlueDot />
            </AdvancedMarker>
          )}
        </Map>
      </div>

    </APIProvider>
  );
};

export default MapWithMarkers;
