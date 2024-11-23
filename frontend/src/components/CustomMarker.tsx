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
  const debounceTimeout = useRef<number | null>(null);

  useEffect(() => {
    const marker = markerRef.current;

    if (marker && marker.content) {
      const handleMouseOver = () => {
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        onHover(location);
      };

      const handleMouseOut = () => {
        // Delay the mouseout event to prevent rapid toggling
        debounceTimeout.current = window.setTimeout(() => {
          onHoverEnd();
        }, 200); // Adjust delay as needed
      };

      marker.content.addEventListener('mouseover', handleMouseOver);
      marker.content.addEventListener('mouseout', handleMouseOut);

      return () => {
        marker.content?.removeEventListener('mouseover', handleMouseOver);
        marker.content?.removeEventListener('mouseout', handleMouseOut);
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
      };
    }
  }, [location, onHover, onHoverEnd]);

  return <AdvancedMarker ref={markerRef} position={getLatLngFromPlace(location)} onClick={onClick} />;
};

export default CustomMarker;
