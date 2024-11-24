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
      // Create custom content for the marker (label + red balloon marker)
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
      label.style.marginBottom = '4px'; // Spacing between label and marker
      content.appendChild(label);

      // Red Balloon Marker
      const balloon = document.createElement('div');
      balloon.style.width = '16px';
      balloon.style.height = '24px';
      balloon.style.backgroundColor = 'red';
      balloon.style.borderRadius = '8px 8px 0 0'; // Rounded top corners for the balloon
      balloon.style.position = 'relative';
      balloon.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.3)';
      balloon.style.marginBottom = '-4px';

      // Balloon Pointer
      const pointer = document.createElement('div');
      pointer.style.width = '0';
      pointer.style.height = '0';
      pointer.style.borderLeft = '8px solid transparent';
      pointer.style.borderRight = '8px solid transparent';
      pointer.style.borderTop = '8px solid red';
      pointer.style.position = 'absolute';
      pointer.style.top = '24px';
      pointer.style.left = '0px';
      pointer.style.transform = 'translateX(-50%)';
      balloon.appendChild(pointer);

      content.appendChild(balloon);

      // Set custom content on the marker
      marker.content = content;

    }
  }, [location, onHover, onHoverEnd]);

  return <AdvancedMarker ref={markerRef} position={getLatLngFromPlace(location)} onClick={onClick} />;
};

export default CustomMarker;
