import React, { useEffect } from 'react';
import { getLatLngFromPlace } from '../utilities';
import { ExtendedGooglePlace } from '../types';

interface CustomMarkerProps {
  location: ExtendedGooglePlace;
  onClick: () => void;
}

const CustomMarker: React.FC<CustomMarkerProps> = ({ location, onClick }) => {
  const markerContainerRef = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    console.log(`CustomMarker: useEffect triggered for location: ${location.name}`);

    if (!markerContainerRef.current) {
      console.error(`CustomMarker: markerContainerRef is not set for location: ${location.name}`);
      return;
    }

    const position = getLatLngFromPlace(location);

    // Create the custom content (label + red balloon)
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
    label.style.boxShadow = '0px 2px 4px rgba(0, 0, 0, 0.3)';
    label.style.marginBottom = '4px';
    content.appendChild(label);

    // Red balloon marker
    const balloon = document.createElement('div');
    balloon.style.width = '16px';
    balloon.style.height = '24px';
    balloon.style.backgroundColor = 'red';
    balloon.style.borderRadius = '50% 50% 0 0';
    balloon.style.position = 'relative';
    balloon.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.3)';
    balloon.style.marginBottom = '-8px';

    // Balloon pointer
    const pointer = document.createElement('div');
    pointer.style.width = '0';
    pointer.style.height = '0';
    pointer.style.borderLeft = '8px solid transparent';
    pointer.style.borderRight = '8px solid transparent';
    pointer.style.borderTop = '8px solid red';
    pointer.style.position = 'absolute';
    pointer.style.bottom = '-8px';
    pointer.style.left = '50%';
    pointer.style.transform = 'translateX(-50%)';

    balloon.appendChild(pointer);
    content.appendChild(balloon);

    // Initialize the marker manually
    const marker = new google.maps.marker.AdvancedMarkerElement({
      map: null, // Will be added to the map later
      position,
      content,
    });

    // Attach the marker to the map
    markerContainerRef.current.appendChild(marker.content!);

    // Attach event listener
    marker.addListener('click', onClick);

    console.log(`CustomMarker: Custom content successfully set for location: ${location.name}`);

    // Cleanup on unmount
    return () => {
      console.log(`CustomMarker: Cleaning up marker for location: ${location.name}`);
      marker.map = null; // Detach from the map
    };
  }, [location, onClick]);

  return <div ref={markerContainerRef} />;
};

export default CustomMarker;
