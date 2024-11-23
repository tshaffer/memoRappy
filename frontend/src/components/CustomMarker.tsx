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

    if (marker) {
      // Create custom content for the marker (label + marker)
      const content = document.createElement('div');
      content.style.display = 'flex';
      content.style.flexDirection = 'column';
      content.style.alignItems = 'center';

      // Label
      const label = document.createElement('div');
      label.textContent = location.name;
      label.style.backgroundColor = 'white';
      label.style.padding = '2px 6px';
      label.style.borderRadius = '4px';
      label.style.border = '1px solid #ccc';
      label.style.whiteSpace = 'nowrap';
      label.style.fontSize = '12px';
      label.style.boxShadow = '0px 2px 4px rgba(0,0,0,0.2)';
      label.style.marginBottom = '4px'; // Adds spacing between label and marker
      content.appendChild(label);

      // Marker (blue dot)
      const markerElement = document.createElement('div');
      markerElement.style.width = '12px';
      markerElement.style.height = '12px';
      markerElement.style.backgroundColor = '#4285F4'; // Google blue
      markerElement.style.borderRadius = '50%';
      markerElement.style.boxShadow = '0 0 8px rgba(66, 133, 244, 0.5)';
      content.appendChild(markerElement);

      // Set custom content on the marker
      marker.content = content;

      // Hover event handlers with debounce
      const handleMouseOver = () => {
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        onHover(location);
      };

      const handleMouseOut = () => {
        debounceTimeout.current = window.setTimeout(() => {
          onHoverEnd();
        }, 200); // Adjust delay as needed
      };

      marker.content.addEventListener('mouseover', handleMouseOver);
      marker.content.addEventListener('mouseout', handleMouseOut);

      return () => {
        // Cleanup listeners and debounce
        marker.content?.removeEventListener('mouseover', handleMouseOver);
        marker.content?.removeEventListener('mouseout', handleMouseOut);
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
      };
    }
  }, [location, onHover, onHoverEnd]);

  return <AdvancedMarker ref={markerRef} position={getLatLngFromPlace(location)} onClick={onClick} />;
};

export default CustomMarker;
