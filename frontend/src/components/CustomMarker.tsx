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
      const handleMouseOver = () => {
        console.log('Mouse over marker:', location);
        onHover(location);
      };

      const handleMouseOut = () => {
        console.log('Mouse out of marker');
        onHoverEnd();
      };

      // Attach event listeners to the marker's content
      marker.content.addEventListener('mouseover', handleMouseOver);
      marker.content.addEventListener('mouseout', handleMouseOut);

      return () => {
        // Cleanup event listeners
        marker.content?.removeEventListener('mouseover', handleMouseOver);
        marker.content?.removeEventListener('mouseout', handleMouseOut);
      };
    }
  }, [location, onHover, onHoverEnd]);

  return <AdvancedMarker ref={markerRef} position={getLatLngFromPlace(location)} onClick={onClick} />;
};

export default CustomMarker;
