import React, { useState, useEffect } from 'react';
import { ExtendedGooglePlace } from '../types';
import { AdvancedMarker, APIProvider, InfoWindow, Map, MapCameraChangedEvent } from '@vis.gl/react-google-maps';
import { getLatLngFromPlace } from '../utilities';
import '../App.css';
import { Typography } from '@mui/material';

interface MapWithMarkersProps {
  initialCenter: google.maps.LatLngLiteral;
  locations: ExtendedGooglePlace[];
}

const DEFAULT_ZOOM = 14;

const MapWithMarkers: React.FC<MapWithMarkersProps> = ({ initialCenter, locations }) => {
  const [currentLocation, setCurrentLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [hoveredLocation, setHoveredLocation] = useState<ExtendedGooglePlace | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<ExtendedGooglePlace | null>(null);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && (event.key === '+' || event.key === '=' || event.key === '-')) {
        event.preventDefault();
        if (event.key === '+' || event.key === '=') {
          setZoom((prevZoom) => prevZoom + 1);
        } else if (event.key === '-') {
          setZoom((prevZoom) => prevZoom - 1);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => console.error('Error getting current location: ', error),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const CustomBlueDot = () => (
    <div style={{
      width: '16px',
      height: '16px',
      backgroundColor: '#4285F4',
      borderRadius: '50%',
      border: '2px solid #FFFFFF',
      boxShadow: '0 0 8px rgba(66, 133, 244, 0.5)',
    }} />
  );

  const handleMarkerClick = (location: ExtendedGooglePlace) => {
    setSelectedLocation(location);
  };

  const handleMarkerHover = (location: ExtendedGooglePlace) => {
    setHoveredLocation(location);
  };

  const handleMarkerHoverEnd = () => {
    setHoveredLocation(null);
  };

  const handleCloseInfoWindow = () => {
    setSelectedLocation(null);
  };

  const handleZoomChanged = (event: MapCameraChangedEvent) => {
    setZoom(event.detail.zoom);
  };

  const renderMarkers = (): JSX.Element[] => {
    return locations.map((location, index) => {
      const position = getLatLngFromPlace(location);
      return (
        <React.Fragment key={index}>
          <AdvancedMarker
            position={position}
            onClick={() => handleMarkerClick(location)}
            onMouseOver={() => handleMarkerHover(location)}
            onMouseOut={handleMarkerHoverEnd}
          />
          {/* Render label */}
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -100%)`,
              whiteSpace: 'nowrap',
              backgroundColor: 'white',
              padding: '2px 4px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '12px',
            }}
          >
            {location.name}
          </div>
        </React.Fragment>
      );
    });
  };

  const renderHoveredInfoWindow = (): JSX.Element | null => {
    if (!hoveredLocation) return null;
    return (
      <InfoWindow
        position={getLatLngFromPlace(hoveredLocation)}
      >
        <div style={{ padding: '4px' }}>
          <h4>{hoveredLocation.name}</h4>
          <Typography>
            {hoveredLocation.reviews[0]?.freeformReviewProperties?.reviewText || 'No review available.'}
          </Typography>
        </div>
      </InfoWindow>
    );
  };

  const renderSelectedInfoWindow = (): JSX.Element | null => {
    if (!selectedLocation) return null;
    return (
      <InfoWindow
        position={getLatLngFromPlace(selectedLocation)}
        onCloseClick={handleCloseInfoWindow}
      >
        <div style={{ padding: '4px' }}>
          <h4>{selectedLocation.name}</h4>
          <Typography>
            {selectedLocation.reviews[0]?.freeformReviewProperties?.reviewText || 'No review available.'}
          </Typography>
        </div>
      </InfoWindow>
    );
  };

  const googleMapsApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY!;

  return (
    <APIProvider apiKey={googleMapsApiKey} version="beta">
      <Map
        style={{ width: '100%', height: '100%' }}
        id="gmap"
        mapId="1ca0b6526e7d4819"
        defaultCenter={initialCenter}
        zoom={zoom}
        onZoomChanged={handleZoomChanged}
        fullscreenControl={false}
        zoomControl={true}
        gestureHandling="greedy"
        scrollwheel={true}
      >
        {renderMarkers()}
        {renderHoveredInfoWindow()}
        {renderSelectedInfoWindow()}
        {currentLocation && (
          <AdvancedMarker position={currentLocation}>
            <CustomBlueDot />
          </AdvancedMarker>
        )}
      </Map>
    </APIProvider>
  );
};

export default MapWithMarkers;
