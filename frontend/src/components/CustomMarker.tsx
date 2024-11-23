import React, { useRef, useEffect } from 'react';
import { AdvancedMarker } from '@vis.gl/react-google-maps';

import { ExtendedGooglePlace } from '../types';
import { getLatLngFromPlace } from '../utilities';

interface CustomMarkerProps {
  location: ExtendedGooglePlace;
  onClick: () => void;
  onHover: (location: ExtendedGooglePlace) => void;
  onHoverEnd: () => void;
}

const CustomMarker: React.FC<CustomMarkerProps> = ({ location, onClick, onHover, onHoverEnd }) => {
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  useEffect(() => {
    const marker = markerRef.current;

    if (marker) {
      const mouseOverListener = google.maps.event.addListener(marker, 'mouseover', () => {
        onHover(location);
      });

      const mouseOutListener = google.maps.event.addListener(marker, 'mouseout', () => {
        onHoverEnd();
      });

      return () => {
        google.maps.event.removeListener(mouseOverListener);
        google.maps.event.removeListener(mouseOutListener);
      };
    }
  }, [location, onHover, onHoverEnd]);

  return <AdvancedMarker ref={markerRef} position={getLatLngFromPlace(location)} onClick={onClick} />;
};

export default CustomMarker;
