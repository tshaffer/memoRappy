import React, { useState, useEffect } from 'react';
import { GooglePlaceResult } from '../types';
import { AdvancedMarker, APIProvider, InfoWindow, Map, MapCameraChangedEvent } from '@vis.gl/react-google-maps';
import { getLatLngFromPlace } from '../utilities';
import { Paper } from '@mui/material';
import '../App.css';

interface Coordinates {
  lat: number;
  lng: number;
}

interface MapWithMarkersProps {
  initialCenter: Coordinates;
  locations: GooglePlaceResult[];
}

const DEFAULT_CENTER = { lat: 37.3944829, lng: -122.0790619 };
const DEFAULT_ZOOM = 14;

const MapWithMarkers: React.FC<MapWithMarkersProps> = ({ initialCenter, locations }) => {

  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<GooglePlaceResult | null>(null);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && (event.key === '+' || event.key === '=' || event.key === '-')) {
        event.preventDefault();
        if (event.key === '+' || event.key === '=') {
          setZoom(zoom + 1);
        } else if (event.key === '-') {
          setZoom(zoom - 1);
        }
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
      return getLatLngFromPlace(locations[0]);
    } else {
      return DEFAULT_CENTER;
    }
  }

  const handleMarkerClick = (location: GooglePlaceResult) => {
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
        position={getLatLngFromPlace(location)}
        onClick={() => handleMarkerClick(location)}
      />
    ));
  }

  const googleMapsApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY!;

  // const initialCenter: Coordinates = getInitialCenter();
  const locationMarkers: JSX.Element[] = renderMarkers();

  return (
    <APIProvider
      apiKey={googleMapsApiKey}
      version="beta"
    >
      {/* <Paper className="map-container"> */}
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
            position={getLatLngFromPlace(selectedLocation)}
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
      {/* </Paper> */}

    </APIProvider>
  );
};

export default MapWithMarkers;
