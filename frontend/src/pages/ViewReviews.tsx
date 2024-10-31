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
} from '@mui/material';
import { ReviewEntityWithFullText } from '../types';

const ViewReviews: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewEntityWithFullText[]>([]);
  const [sortBy, setSortBy] = useState<keyof ReviewEntityWithFullText>('restaurantName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [sortedReviews, setSortedReviews] = useState<ReviewEntityWithFullText[]>([]);
  const [selectedReview, setSelectedReview] = useState<ReviewEntityWithFullText | null>(null);

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
  }, []);

  useEffect(() => {
    // Sort reviews based on current sortBy and sortDirection
    const sorted = [...reviews].sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

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
        <Typography><strong>Location:</strong> {selectedReview.userLocation || 'Not provided'}</Typography>
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
                    key={review.restaurantName} // Replace with unique key if available
                    hover
                    onClick={() => setSelectedReview(review)}
                    style={{ cursor: 'pointer' }}
                  >
                    <TableCell>{review.restaurantName}</TableCell>
                    <TableCell>{review.overallExperience}</TableCell>
                    <TableCell>{review.dateOfVisit}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper>{renderDetailPanel()}</Paper>
      </Grid>
    </Grid>
  );
};

export default ViewReviews;
