import React, { useState, useEffect } from 'react';
import { PlaceProperties } from '../types';
import { AdvancedMarker, APIProvider, InfoWindow, Map, Marker, Pin } from '@vis.gl/react-google-maps';

interface Coordinates {
  lat: number;
  lng: number;
}

interface MapWithMarkersProps {
  locations: PlaceProperties[];
}

const DEFAULT_CENTER = { lat: 37.3944829, lng: -122.0790619 };
const DEFAULT_ZOOM = 14;

const MapWithMarkers: React.FC<MapWithMarkersProps> = ({ locations }) => {

  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<PlaceProperties | null>(null);

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

  const handleMarkerClick = (location: PlaceProperties) => {
    setSelectedLocation(location);
  };

  const handleCloseInfoWindow = () => {
    setSelectedLocation(null);
  };

  const getLocationMarkers = (): JSX.Element[] => {
    return locations.map((location, index) => (
      <AdvancedMarker
        key={index}
        position={{ lat: location.latitude, lng: location.longitude }}
        onClick={() => handleMarkerClick(location)}
      />
    ));
  }

  const googleMapsApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY!;

  const locationMarkers: JSX.Element[] = getLocationMarkers();
  //           center={{ lat: locations[0].latitude, lng: locations[0].longitude }}

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
          {locationMarkers}
          {currentLocation && (
            <AdvancedMarker position={currentLocation}>
              <CustomBlueDot />
            </AdvancedMarker>
          )}
          {selectedLocation && (
            <InfoWindow
              position={{ lat: selectedLocation.latitude, lng: selectedLocation.longitude }}
              onCloseClick={handleCloseInfoWindow}
            >
              <div>
                <h4>{selectedLocation.name}</h4>
                <a href={selectedLocation.website} target="_blank" rel="noopener noreferrer">
                  {selectedLocation.website}
                </a>
              </div>
            </InfoWindow>
          )}
        </Map>
      </div>

    </APIProvider>
  );
};

export default MapWithMarkers;
