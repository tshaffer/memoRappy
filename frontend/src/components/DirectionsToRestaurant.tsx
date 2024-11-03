import React, { useEffect, useState } from 'react';
import { PlaceProperties } from '../types';
import { APIProvider, Map } from '@vis.gl/react-google-maps';
import { DirectionsRenderer } from '@react-google-maps/api';

interface DirectionsToRestaurantProps {
  origin: { lat: number; lng: number };
  destination: PlaceProperties;
}

const DirectionsToRestaurant: React.FC<DirectionsToRestaurantProps> = ({ origin, destination }) => {
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const googleMapsApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY!;

  useEffect(() => {
    if (!origin || !destination) return;

    const directionsService = new google.maps.DirectionsService();
    directionsService.route(
      {
        origin,
        destination: { lat: destination.latitude, lng: destination.longitude },
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
          setDirections(result);
        } else {
          setError("Could not retrieve directions.");
          console.error(`Directions request failed due to ${status}`);
        }
      }
    );
  }, [origin, destination]);

  return (
    <APIProvider apiKey={googleMapsApiKey} version="beta">
      <div style={{ position: 'relative', width: '100%', height: '400px' }}>
        <Map
          id="directions-map"
          style={{ width: '100%', height: '100%' }}
          center={origin}
          zoom={14}
        >
          {directions && <DirectionsRenderer directions={directions} />}
          {error && <div>Error: {error}</div>}
        </Map>
      </div>
    </APIProvider>
  );
};

export default DirectionsToRestaurant;
