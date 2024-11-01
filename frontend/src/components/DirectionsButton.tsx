import React from 'react';
import { Button } from '@mui/material';

interface DirectionsButtonProps {
  latitude: number;
  longitude: number;
}

const DirectionsButton: React.FC<DirectionsButtonProps> = ({ latitude, longitude }) => {

  const handleGetDirections = () => {
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    window.open(googleMapsUrl, '_blank');
  };
  
  return (
    <Button variant="contained" color="primary" onClick={handleGetDirections}>
      Get Directions
    </Button>
  );
};

export default DirectionsButton;
