import React, { useState, useEffect } from 'react';
import { PlaceProperties } from '../types';
import { AdvancedMarker, APIProvider, InfoWindow, Map, MapCameraChangedEvent, Marker, Pin } from '@vis.gl/react-google-maps';

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
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      console.log('handleKeyDown');
      console.log('metaKey: ', event.metaKey);
      console.log('ctrlKey: ', event.ctrlKey);
      console.log('key: ', event.key);
      if ((event.metaKey || event.ctrlKey) && (event.key === '+' || event.key === '=' || event.key === '-')) {
        event.preventDefault();
        console.log(`Blocked page zoom with ${event.metaKey ? 'Cmd' : 'Ctrl'} + ${event.key}`);
        let newZoom;
        if (event.key === '+' || event.key === '=') {
          newZoom = zoom + 1;
          setZoom(newZoom);
        } else if (event.key === '-') {
          newZoom = zoom - 1;
          setZoom(newZoom);
        }
        console.log('newZoom: ', newZoom);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [zoom]);

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

  const getInitialCenter = (): Coordinates => {
    if (currentLocation) {
      return currentLocation;
    } else if (locations.length > 0) {
      return { lat: locations[0].latitude, lng: locations[0].longitude };
    } else {
      return DEFAULT_CENTER;
    }
  }

  const handleMarkerClick = (location: PlaceProperties) => {
    setSelectedLocation(location);
  };

  const handleCloseInfoWindow = () => {
    setSelectedLocation(null);
  };

  const handleZoomChanged = (event: MapCameraChangedEvent) => {
    console.log('handleZoomChanged event: ', event);
    console.log('event.detail.zoom: ', event.detail.zoom);
    setZoom(event.detail.zoom);
  };

  const renderMarkers = (): JSX.Element[] => {
    return locations.map((location, index) => (
      <AdvancedMarker
        key={index}
        position={{ lat: location.latitude, lng: location.longitude }}
        onClick={() => handleMarkerClick(location)}
      />
    ));
  }

  const googleMapsApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY!;

  const initialCenter: Coordinates = getInitialCenter();
  const locationMarkers: JSX.Element[] = renderMarkers();

  return (
    <APIProvider
      apiKey={googleMapsApiKey}
      version="beta">
      <div
        style={{
          position: 'relative',
          width: '100vw',
          height: '100vh',
          overflow: 'hidden', // Ensures that the map fills the entire viewport
        }}
        slot="main"
      >
        <Map
          style={{ width: '100%', height: '100%' }}
          id="gmap"
          mapId="1ca0b6526e7d4819"
          defaultCenter={initialCenter}
          zoom={zoom}
          onZoomChanged={(event) => handleZoomChanged(event)}
          fullscreenControl={false}
          zoomControl={true}
          gestureHandling={'greedy'}
          scrollwheel={true}
        >
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
