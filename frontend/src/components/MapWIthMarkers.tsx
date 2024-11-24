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
    // Assign custom content (label + red balloon) to each marker
    locations.forEach((location, index) => {
      const marker = markerRefs.current[index];

      if (marker) {
        // Create container for the label and red balloon
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.alignItems = 'center';

        // Label
        const label = document.createElement('div');
        label.style.backgroundColor = 'white';
        label.style.border = '1px solid #ccc';
        label.style.borderRadius = '4px';
        label.style.padding = '2px 6px';
        label.style.boxShadow = '0px 2px 4px rgba(0, 0, 0, 0.3)';
        label.style.whiteSpace = 'nowrap';
        label.style.fontSize = '12px';
        label.style.marginBottom = '4px';
        label.innerText = location.name;

        // Red balloon (default marker appearance)
        const redBalloon = document.createElement('div');
        redBalloon.style.width = '16px';
        redBalloon.style.height = '24px';
        redBalloon.style.backgroundColor = 'red';
        redBalloon.style.borderRadius = '8px 8px 0 0'; // Balloon shape
        redBalloon.style.position = 'relative';
        redBalloon.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.3)';

        // Balloon pointer
        const pointer = document.createElement('div');
        pointer.style.width = '0';
        pointer.style.height = '0';
        pointer.style.borderLeft = '8px solid transparent';
        pointer.style.borderRight = '8px solid transparent';
        pointer.style.borderTop = '8px solid red';
        pointer.style.position = 'absolute';
        pointer.style.top = '24px';
        pointer.style.left = '0px';
        pointer.style.transform = 'translateX(-50%)';
        redBalloon.appendChild(pointer);

        container.appendChild(label);
        container.appendChild(redBalloon);

        // Assign custom content to marker
        marker.content = container;
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
