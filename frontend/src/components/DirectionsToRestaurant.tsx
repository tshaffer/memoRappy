import React, { useEffect, useState } from 'react';
import { PlaceProperties } from '../types';
import { APIProvider, Map, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
// import { DirectionsRenderer } from '@react-google-maps/api';

function Directions() {
  const map = useMap();
  const routesLibrary = useMapsLibrary('routes');
  const [directionsService, setDirectionsService] =
    useState<google.maps.DirectionsService>();
  const [directionsRenderer, setDirectionsRenderer] =
    useState<google.maps.DirectionsRenderer>();
  const [routes, setRoutes] = useState<google.maps.DirectionsRoute[]>([]);
  const [routeIndex, setRouteIndex] = useState(0);
  const selected = routes[routeIndex];
  const leg = selected?.legs[0];

  // Initialize directions service and renderer
  useEffect(() => {
    if (!routesLibrary || !map) return;
    setDirectionsService(new routesLibrary.DirectionsService());
    setDirectionsRenderer(new routesLibrary.DirectionsRenderer({ map }));
  }, [routesLibrary, map]);

  // Use directions service
  useEffect(() => {
    if (!directionsService || !directionsRenderer) return;

    directionsService
      .route({
        origin: '100 Front St, Toronto ON',
        destination: '500 College St, Toronto ON',
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true
      })
      .then(response => {
        directionsRenderer.setDirections(response);
        setRoutes(response.routes);
      });

    return () => directionsRenderer.setMap(null);
  }, [directionsService, directionsRenderer]);

  // Update direction route
  useEffect(() => {
    if (!directionsRenderer) return;
    directionsRenderer.setRouteIndex(routeIndex);
  }, [routeIndex, directionsRenderer]);

  if (!leg) return null;

  return (
    <div className="directions">
      <h2>{selected.summary}</h2>
      <p>
        {leg.start_address.split(',')[0]} to {leg.end_address.split(',')[0]}
      </p>
      <p>Distance: {leg.distance?.text}</p>
      <p>Duration: {leg.duration?.text}</p>

      <h2>Other Routes</h2>
      <ul>
        {routes.map((route, index) => (
          <li key={route.summary}>
            <button onClick={() => setRouteIndex(index)}>
              {route.summary}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface DirectionsToRestaurantProps {
  origin: { lat: number; lng: number };
  destination: PlaceProperties;
}

const DirectionsToRestaurant: React.FC<DirectionsToRestaurantProps> = ({ origin, destination }) => {
  const map = useMap();
  const routesLibrary = useMapsLibrary('routes');
  const [directionsService, setDirectionsService] =
    useState<google.maps.DirectionsService>();
  const [directionsRenderer, setDirectionsRenderer] =
    useState<google.maps.DirectionsRenderer>();
  const [routes, setRoutes] = useState<google.maps.DirectionsRoute[]>([]);
  const [routeIndex, setRouteIndex] = useState(0);
  const selected = routes[routeIndex];
  const leg = selected?.legs[0];
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize directions service and renderer
  useEffect(() => {
    if (!directionsService || !directionsRenderer) return;

    if (!routesLibrary || !map) return;
    setDirectionsService(new routesLibrary.DirectionsService());
    setDirectionsRenderer(new routesLibrary.DirectionsRenderer({ map }));
  }, [routesLibrary, map]);

  const googleMapsApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY!;

  // useEffect(() => {
  //   if (!origin || !destination) return;

  //   const directionsService = new google.maps.DirectionsService();
  //   directionsService.route(
  //     {
  //       origin,
  //       destination: { lat: destination.latitude, lng: destination.longitude },
  //       travelMode: google.maps.TravelMode.DRIVING,
  //     },
  //     (result, status) => {
  //       if (status === google.maps.DirectionsStatus.OK) {
  //         setDirections(result);
  //       } else {
  //         setError("Could not retrieve directions.");
  //         console.error(`Directions request failed due to ${status}`);
  //       }
  //     }
  //   );
  // }, [origin, destination]);

  useEffect(() => {
    if (!origin || !destination) return;
    if (!directionsService || !directionsRenderer) return;

    directionsService
      .route({
        origin,
        destination: { lat: destination.latitude, lng: destination.longitude },
        travelMode: google.maps.TravelMode.DRIVING,
      })
      .then(response => {
        directionsRenderer.setDirections(response);
        setRoutes(response.routes);
      });

    return () => directionsRenderer.setMap(null);
  }, [origin, destination, directionsService, directionsRenderer]);

  // Update direction route
  useEffect(() => {
    if (!directionsRenderer) return;
    directionsRenderer.setRouteIndex(routeIndex);
  }, [routeIndex, directionsRenderer]);

  if (!leg) return null;

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
