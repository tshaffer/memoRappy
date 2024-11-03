import React, { useEffect, useRef, useState } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { PlaceProperties } from '../types';

interface DirectionsToRestaurantProps {
  origin: { lat: number; lng: number };
  destination: PlaceProperties;
}

const DirectionsToRestaurant: React.FC<DirectionsToRestaurantProps> = ({ origin, destination }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const googleMapsApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY!;

  useEffect(() => {
    // Check if the Google Maps API is loaded
    if (window.google && window.google.maps) {
      setMapLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current) return;

    const map = new google.maps.Map(mapContainerRef.current, {
      center: origin,
      zoom: 14,
    });

    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);
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

    return () => {
      directionsRendererRef.current?.setMap(null);
    };
  }, [mapLoaded, origin, destination]);

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
