import React, { useState, useEffect } from 'react';
import { ExtendedGooglePlace } from '../types';
import { APIProvider, InfoWindow, Map, MapCameraChangedEvent } from '@vis.gl/react-google-maps';
import '../App.css';
import CustomMarker from './CustomMarker';

interface MapWithMarkersProps {
  initialCenter: google.maps.LatLngLiteral;
  locations: ExtendedGooglePlace[];
}

const DEFAULT_ZOOM = 14;

const MapWithMarkers: React.FC<MapWithMarkersProps> = ({ initialCenter, locations }) => {
  const [selectedLocation, setSelectedLocation] = useState<ExtendedGooglePlace | null>(null);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);

  const handleMarkerClick = (location: ExtendedGooglePlace) => {
    console.log('MapWithMarkers: Marker clicked for location:', location.name);
    setSelectedLocation(location);
  };

  const handleZoomChanged = (event: MapCameraChangedEvent) => {
    console.log('MapWithMarkers: Zoom level changed:', event.detail.zoom);
    setZoom(event.detail.zoom);
  };

  const renderMarkers = (): JSX.Element[] => {
    console.log('MapWithMarkers: Rendering markers...');
    return locations.map((location, index) => (
      <CustomMarker
        key={index}
        location={location}
        onClick={() => handleMarkerClick(location)}
      />
    ));
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
        zoomControl
        gestureHandling="greedy"
        scrollwheel
      >
        {renderMarkers()}
      </Map>
    </APIProvider>
  );
};

export default MapWithMarkers;
