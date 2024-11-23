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

    if (marker && marker.content) {
      const handleMouseOver = (event: Event) => {
        const mouseEvent = event as MouseEvent;
        const target = mouseEvent.relatedTarget as HTMLElement;
        if (marker.content && !marker.content.contains(target)) {
          onHover(location);
        }
      };

      const handleMouseOut = (event: Event) => {
        const mouseEvent = event as MouseEvent;
        const target = mouseEvent.relatedTarget as HTMLElement;
        if (marker.content && !marker.content.contains(target)) {
          onHoverEnd();
        }
      };

      marker.content.addEventListener('mouseover', handleMouseOver);
      marker.content.addEventListener('mouseout', handleMouseOut);

      return () => {
        marker.content?.removeEventListener('mouseover', handleMouseOver);
        marker.content?.removeEventListener('mouseout', handleMouseOut);
      };
    }
  }, [location, onHover, onHoverEnd]);

  return <AdvancedMarker ref={markerRef} position={getLatLngFromPlace(location)} onClick={onClick} />;
};

export default CustomMarker;
