import React, { useEffect, useRef } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { PlaceProperties } from '../types';

interface DirectionsToRestaurantProps {
  origin: { lat: number; lng: number };
  destination: PlaceProperties;
}

const DirectionsToRestaurant: React.FC<DirectionsToRestaurantProps> = ({ origin, destination }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const googleMapsApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY!;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize the map only once
    if (!mapRef.current) {
      mapRef.current = new google.maps.Map(mapContainerRef.current, {
        center: origin,
        zoom: 14,
      });
    }

    // Set up DirectionsService and DirectionsRenderer
    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(mapRef.current);
    directionsRendererRef.current = directionsRenderer;

    // Request directions
    directionsService.route(
      {
        origin,
        destination: { lat: destination.latitude, lng: destination.longitude },
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
          directionsRenderer.setDirections(result);
        } else {
          console.error(`Directions request failed due to ${status}`);
        }
      }
    );

    // Clean up the directions renderer when the component unmounts
    return () => {
      directionsRendererRef.current?.setMap(null);
    };
  }, [origin, destination]);

  return (
    <APIProvider apiKey={googleMapsApiKey} version="beta">
      <div
        ref={mapContainerRef}
        style={{ position: 'relative', width: '100%', height: '400px' }}
      />
    </APIProvider>
  );
};

export default DirectionsToRestaurant;
