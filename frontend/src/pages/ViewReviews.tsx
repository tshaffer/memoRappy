import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
  Box,
  Grid,
  Checkbox,
  Button,
  IconButton,
} from '@mui/material';
import DirectionsIcon from '@mui/icons-material/Directions';
import EditIcon from '@mui/icons-material/Edit';
import { GooglePlaceResult, ReviewEntityWithFullText } from '../types';
import MapWithMarkers from '../components/MapWIthMarkers';
import { getCityNameFromPlace } from '../utilities';

interface ColumnProperties {
  restaurantLabel: string;
  location: string;
  dateOfVisit: string;
  wouldReturn: string;
}

const ViewReviews: React.FC = () => {

  const navigate = useNavigate();

  const [reviews, setReviews] = useState<ReviewEntityWithFullText[]>([]);
  const [sortBy, setSortBy] = useState<keyof ColumnProperties>('restaurantLabel');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [sortedReviews, setSortedReviews] = useState<ReviewEntityWithFullText[]>([]);
  const [selectedReview, setSelectedReview] = useState<ReviewEntityWithFullText | null>(null);
  const [selectedReviews, setSelectedReviews] = useState<ReviewEntityWithFullText[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    // Fetch the reviews from the API
    const fetchReviews = async () => {
      const response = await fetch('/api/reviews');
      const data = await response.json();
      const reviews: ReviewEntityWithFullText[] = data.googleReviews;
      setReviews(reviews);
      if (data.length > 0) {
        setSelectedReview(data[0]); // Select the first review by default
      }
    };
    fetchReviews();

    // Get the user's current location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => console.error('Error getting current location:', error)
    );
  }, []);

  useEffect(() => {
    // Sort reviews based on current sortBy and sortDirection
    const sorted = [...reviews].sort((a, b) => {
      let aValue;
      let bValue;

      if (sortBy === 'restaurantLabel') {
        aValue = getCityNameFromPlace(a.googlePlace) || '';
        bValue = getCityNameFromPlace(b.googlePlace) || '';
      } else if (sortBy === 'wouldReturn') {
        aValue = getWouldReturnFromReview(a);
        bValue = getWouldReturnFromReview(b);
      } else {
        if (sortBy === 'location') {
          aValue = getCityNameFromPlace(a.googlePlace) || '';
          bValue = getCityNameFromPlace(b.googlePlace) || '';
        } else if (sortBy === 'dateOfVisit') {
          aValue = a.dateOfVisit;
          bValue = b.dateOfVisit;
        } else {
          aValue = a[sortBy];
          bValue = b[sortBy];
        }
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      return 0;
    });
    setSortedReviews(sorted);
  }, [reviews, sortBy, sortDirection]);

  const handleSort = (property: keyof ColumnProperties) => {
    const isAsc = sortBy === property && sortDirection === 'asc';
    setSortBy(property);
    setSortDirection(isAsc ? 'desc' : 'asc');
  };

  const handleSelectReview = (review: ReviewEntityWithFullText) => {
    setSelectedReviews((prevSelected) =>
      prevSelected.includes(review)
        ? prevSelected.filter((r) => r !== review)
        : [...prevSelected, review]
    );
  };

  const renderDetailPanel = () => {
    if (!selectedReview) {
      return (
        <Box p={3}>
          <Typography variant="h6" color="textSecondary">
            Select a review to see the details.
          </Typography>
        </Box>
      );
    }
    return (
      <Box p={3}>
        <Typography variant="h6" gutterBottom>{selectedReview.googlePlace.name}</Typography>
        <Typography><strong>Location:</strong> {getCityNameFromPlace(selectedReview.googlePlace) || 'Not provided'}</Typography>
        <Typography><strong>Would Return:</strong> {getWouldReturnFromReview(selectedReview)}</Typography>
        <Typography><strong>Date of Visit:</strong> {selectedReview.dateOfVisit || 'Not provided'}</Typography>
        <Typography><strong>Reviewer:</strong> {selectedReview.reviewer || 'Anonymous'}</Typography>

        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
          Items Ordered
        </Typography>
        <ul>
          {selectedReview.itemReviews.map((itemReview, idx) => (
            <li key={idx}>
              {itemReview.item} - {itemReview.review || 'No rating provided'}
            </li>
          ))}
        </ul>

        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
          Review Text
        </Typography>
        <Typography>{selectedReview.reviewText}</Typography>
      </Box>
    );
  };

  const locations: GooglePlaceResult[] = selectedReviews.map((review) => review.googlePlace);

  const handleEditReview = (review: ReviewEntityWithFullText) => {
    console.log('handleEditReview', review);
    // navigate(`/edit-review/${review.id}`); 
    navigate("/add-review"); 

  }

  const handleShowDirections = (review: ReviewEntityWithFullText) => {
    if (currentLocation) {
      const destination: GooglePlaceResult = review.googlePlace;
      const destinationLocation: google.maps.LatLngLiteral = destination.geometry!.location;
      const destinationLatLng: google.maps.LatLngLiteral = { lat: destinationLocation.lat, lng: destinationLocation.lng };
      const url = `https://www.google.com/maps/dir/?api=1&origin=${currentLocation.lat},${currentLocation.lng}&destination=${destinationLatLng.lat},${destinationLatLng.lng}&destination_place_id=${destination.name}`;
      window.open(url, '_blank');
    }
  };

  const getWouldReturnFromReview = (review: ReviewEntityWithFullText): string => {
    if (review.wouldReturn === true) {
      return 'Yes';
    } else if (review.wouldReturn === false) {
      return 'No';
    } else {
      return 'N/A';
    }
  }

  return (

    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Paper>
          <Typography variant="h4" gutterBottom>
            View Reviews
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox />
                  </TableCell>
                  <TableCell>
                  </TableCell>
                  <TableCell>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortBy === 'restaurantLabel'}
                      direction={sortBy === 'restaurantLabel' ? sortDirection : 'asc'}
                      onClick={() => handleSort('restaurantLabel')}
                    >
                      Restaurant Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortBy === 'location'}
                      direction={sortBy === 'location' ? sortDirection : 'asc'}
                      onClick={() => handleSort('location')}
                    >
                      Location
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortBy === 'wouldReturn'}
                      direction={sortBy === 'wouldReturn' ? sortDirection : 'asc'}
                      onClick={() => handleSort('wouldReturn')}
                    >
                      Would Return
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortBy === 'dateOfVisit'}
                      direction={sortBy === 'dateOfVisit' ? sortDirection : 'asc'}
                      onClick={() => handleSort('dateOfVisit')}
                    >
                      Date of Visit
                    </TableSortLabel>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedReviews.map((review, idx) => (
                  <TableRow
                    key={idx}
                    hover
                    onClick={() => setSelectedReview(review)}
                    selected={selectedReviews.includes(review)}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedReviews.includes(review)}
                        onChange={() => handleSelectReview(review)}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEditReview(review)}>
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleShowDirections(review)}>
                        <DirectionsIcon />
                      </IconButton>
                    </TableCell>
                    <TableCell>{review.googlePlace.name}</TableCell>
                    <TableCell>{getCityNameFromPlace(review.googlePlace)}</TableCell>
                    <TableCell>{getWouldReturnFromReview(review)}</TableCell>
                    <TableCell>{review.dateOfVisit}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={() => setShowMap(true)}
          disabled={selectedReviews.length === 0}
        >
          Show Map
        </Button>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper>{renderDetailPanel()}</Paper>
      </Grid>
      {showMap && (
        <MapWithMarkers
          locations={locations}
        />
      )}
    </Grid>
  );
};

export default ViewReviews;
