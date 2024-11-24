import React, { useState, useEffect } from 'react';
import { ExtendedGooglePlace } from '../types';
import { AdvancedMarker, APIProvider, InfoWindow, Map, MapCameraChangedEvent } from '@vis.gl/react-google-maps';
import { getLatLngFromPlace } from '../utilities';
import '../App.css';

interface MapWithMarkersProps {
  initialCenter: google.maps.LatLngLiteral;
  locations: ExtendedGooglePlace[];
}

const DEFAULT_ZOOM = 14;

const MapWithMarkers: React.FC<MapWithMarkersProps> = ({ initialCenter, locations }) => {
  const [currentLocation, setCurrentLocation] = useState<google.maps.LatLngLiteral | null>(null);
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

  const handleMarkerClick = (location: ExtendedGooglePlace) => {
    setSelectedLocation(location);
  };

  const handleCloseInfoWindow = () => {
    setSelectedLocation(null);
  };

  const handleZoomChanged = (event: MapCameraChangedEvent) => {
    setZoom(event.detail.zoom);
  };

  const renderMarkers = (): JSX.Element[] => {
    return locations.map((location, index) => {
      const markerRef = React.createRef<google.maps.marker.AdvancedMarkerElement>();

      useEffect(() => {
        const marker = markerRef.current;

        if (marker) {
          // Create custom content for the label
          const labelContent = document.createElement('div');
          labelContent.style.backgroundColor = 'white';
          labelContent.style.border = '1px solid #ccc';
          labelContent.style.borderRadius = '4px';
          labelContent.style.padding = '2px 6px';
          labelContent.style.boxShadow = '0px 2px 4px rgba(0, 0, 0, 0.3)';
          labelContent.style.whiteSpace = 'nowrap';
          labelContent.style.fontSize = '12px';
          labelContent.style.marginBottom = '4px'; // Spacing between label and marker
          labelContent.innerText = location.name;

          // Set the custom content on the marker
          marker.content = labelContent;
        }
      }, [location]);

      return (
        <AdvancedMarker
          key={index}
          ref={markerRef}
          position={getLatLngFromPlace(location)}
          onClick={() => handleMarkerClick(location)}
        />
      );
    });
  };

  const renderInfoWindow = (): JSX.Element | null => {
    if (!selectedLocation) return null;

    return (
      <InfoWindow
        position={getLatLngFromPlace(selectedLocation)}
        onCloseClick={handleCloseInfoWindow}
      >
        <div style={{ padding: '4px' }}>
          <h4>{selectedLocation.name}</h4>
          <p>{selectedLocation.website}</p>
        </div>
      </InfoWindow>
    );
  };

  const googleMapsApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY!;

  const locationMarkers: JSX.Element[] = renderMarkers();

  return (
    <APIProvider apiKey={googleMapsApiKey} version="beta">
      <Map
        style={{ width: '100%', height: '100%' }}
        id="gmap"
        mapId="1ca0b6526e7d4819"
        defaultCenter={initialCenter}
        zoom={zoom}
        onZoomChanged={(event) => handleZoomChanged(event)}
        fullscreenControl={false}
        zoomControl={true}
        gestureHandling="greedy"
        scrollwheel={true}
      >
        {locationMarkers}
        {currentLocation && (
          <AdvancedMarker position={currentLocation}>
            <div
              style={{
                width: '12px',
                height: '12px',
                backgroundColor: '#4285F4',
                borderRadius: '50%',
                border: '2px solid white',
              }}
            />
          </AdvancedMarker>
        )}
        {selectedLocation && renderInfoWindow()}
      </Map>
    </APIProvider>
  );
};

export default MapWithMarkers;
