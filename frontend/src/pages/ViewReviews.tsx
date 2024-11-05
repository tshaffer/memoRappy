import React, { useState, useEffect } from 'react';
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
import { LatLngLiteral, MemoRappPlaceProperties, ReviewEntityWithFullText } from '../types';
import MapWithMarkers from '../components/MapWIthMarkers';
import { getCityNameFromPlace, getLatLngFromPlace } from '../utilities';

const ViewReviews: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewEntityWithFullText[]>([]);
  const [sortBy, setSortBy] = useState<keyof ReviewEntityWithFullText>('restaurantName');
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
      const reviews: ReviewEntityWithFullText[] = data.reviews;
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

      if (sortBy === 'placeProperties') {
        aValue = getCityNameFromPlace(a.placeProperties) || '';
        bValue = getCityNameFromPlace(b.placeProperties) || '';
      } else {
        aValue = a[sortBy];
        bValue = b[sortBy];
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

  const handleSort = (property: keyof ReviewEntityWithFullText) => {
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
        <Typography variant="h6" gutterBottom>{selectedReview.restaurantName}</Typography>
        <Typography><strong>Location:</strong> {getCityNameFromPlace(selectedReview.placeProperties) || 'Not provided'}</Typography>
        <Typography><strong>Date of Visit:</strong> {selectedReview.dateOfVisit || 'Not provided'}</Typography>
        <Typography><strong>Reviewer:</strong> {selectedReview.reviewer || 'Anonymous'}</Typography>
        <Typography><strong>Overall Experience:</strong> {selectedReview.overallExperience || 'No rating'}</Typography>

        <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
          Items Ordered
        </Typography>
        <ul>
          {selectedReview.itemsOrdered.map((item, idx) => (
            <li key={idx}>
              {item} - {selectedReview.ratings[idx]?.rating || 'No rating provided'}
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

  const locations: MemoRappPlaceProperties[] = selectedReviews.map((review) => review.placeProperties);

  const handleShowDirections = (review: ReviewEntityWithFullText) => {
    if (currentLocation) {
      const destination: MemoRappPlaceProperties = review.placeProperties;
      const destinationLatLng: LatLngLiteral = getLatLngFromPlace(destination);
      const url = `https://www.google.com/maps/dir/?api=1&origin=${currentLocation.lat},${currentLocation.lng}&destination=${destinationLatLng.lat},${destinationLatLng.lng}&destination_place_id=${destination.name}`;
      window.open(url, '_blank');
    }
  };

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
                    <TableSortLabel
                      active={sortBy === 'restaurantName'}
                      direction={sortBy === 'restaurantName' ? sortDirection : 'asc'}
                      onClick={() => handleSort('restaurantName')}
                    >
                      Restaurant Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortBy === 'placeProperties'}
                      direction={sortBy === 'placeProperties' ? sortDirection : 'asc'}
                      onClick={() => handleSort('placeProperties')}
                    >
                      Location
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortBy === 'overallExperience'}
                      direction={sortBy === 'overallExperience' ? sortDirection : 'asc'}
                      onClick={() => handleSort('overallExperience')}
                    >
                      Overall Experience
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
                {sortedReviews.map((review) => (
                  <TableRow
                    key={review.restaurantName}
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
                      <IconButton onClick={() => handleShowDirections(review)}>
                        <DirectionsIcon />
                      </IconButton>
                    </TableCell>
                    <TableCell>{review.restaurantName}</TableCell>
                    <TableCell>{getCityNameFromPlace(review.placeProperties)}</TableCell>
                    <TableCell>{review.overallExperience}</TableCell>
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
