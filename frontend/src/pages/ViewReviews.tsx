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
} from '@mui/material';
import { GoogleLocation, ReviewEntityWithFullText } from '../types';
import MapWithMarkers from '../components/MapWithMarkers';

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

      if (sortBy === 'googleLocation') {
        aValue = a.googleLocation.cityName || '';
        bValue = b.googleLocation.cityName || '';
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
        <Typography variant="h6" gutterBottom>
          {selectedReview.restaurantName}
        </Typography>
        <Typography><strong>Location:</strong> {selectedReview.googleLocation.cityName || 'Not provided'}</Typography>
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

  const locations: GoogleLocation[] = selectedReviews.map((review) => review.googleLocation);

  const generateGoogleMapsUrl = () => {
    const locations: GoogleLocation[] = selectedReviews.map((review) => review.googleLocation);
    const destination = locations[locations.length - 1];
    const waypoints = locations.slice(0, -1).map(loc => `${loc.latitude},${loc.longitude}`).join('|');

    return `https://www.google.com/maps/dir/?api=1` +
      `&origin=${currentLocation ? `${currentLocation.lat},${currentLocation.lng}` : 'My+Location'}` +
      `&destination=${destination.latitude},${destination.longitude}` +
      (waypoints ? `&waypoints=${waypoints}` : '');
  };

  const handleShowMap = () => {
    const googleMapsUrl = generateGoogleMapsUrl();
    window.open(googleMapsUrl, '_blank');
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
                      active={sortBy === 'googleLocation'}
                      direction={sortBy === 'googleLocation' ? sortDirection : 'asc'}
                      onClick={() => handleSort('googleLocation')}
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
                    <TableCell>{review.restaurantName}</TableCell>
                    <TableCell>{review.googleLocation.cityName}</TableCell>
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
          onClick={handleShowMap}
          disabled={selectedReviews.length === 0 || !currentLocation}
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
