import React, { useState, useEffect, useRef } from 'react';
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

  const markerRefs = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && (event.key === '+' || event.key === '=' || event.key === '-')) {
        event.preventDefault();
        setZoom((prevZoom) => prevZoom + (event.key === '-' ? -1 : 1));
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

  useEffect(() => {
    // Assign custom content (labels) to each marker
    locations.forEach((location, index) => {
      const marker = markerRefs.current[index];

      if (marker) {
        const labelContent = document.createElement('div');
        labelContent.style.backgroundColor = 'white';
        labelContent.style.border = '1px solid #ccc';
        labelContent.style.borderRadius = '4px';
        labelContent.style.padding = '2px 6px';
        labelContent.style.boxShadow = '0px 2px 4px rgba(0, 0, 0, 0.3)';
        labelContent.style.whiteSpace = 'nowrap';
        labelContent.style.fontSize = '12px';
        labelContent.style.marginBottom = '4px';
        labelContent.innerText = location.name;

        marker.content = labelContent;
      }
    });
  }, [locations]);

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
      return (
        <AdvancedMarker
          key={index}
          ref={(el) => {
            if (el) markerRefs.current[index] = el;
          }}
          position={getLatLngFromPlace(location)}
          onClick={() => handleMarkerClick(location)}
        />
      );
    });
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
        {selectedLocation && (
          <InfoWindow
            position={getLatLngFromPlace(selectedLocation)}
            onCloseClick={handleCloseInfoWindow}
          >
            <div>{selectedLocation.name}</div>
          </InfoWindow>
        )}
      </Map>
    </APIProvider>
  );
};

export default MapWithMarkers;
