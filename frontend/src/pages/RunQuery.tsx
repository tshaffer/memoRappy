import React, { useEffect, useState } from 'react';
import { TextField, Button, Typography, Paper, Grid, Table, TableHead, TableBody, TableCell, TableRow } from '@mui/material';

const RunQuery: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    restaurant: '',
    location: '',
    startDate: '',
    endDate: '',
    item: '',
  });

  // Convert date to ISO format (if available)
  const convertToISO = (date: string) => {
    return date ? new Date(date).toISOString() : '';
  };

  // Fetch reviews from the backend
  const fetchReviews = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.restaurant) queryParams.append('restaurant', filters.restaurant);
      if (filters.location) queryParams.append('location', filters.location);

      // Convert startDate and endDate to ISO format
      const isoStartDate = convertToISO(filters.startDate);
      const isoEndDate = convertToISO(filters.endDate);

      if (isoStartDate) queryParams.append('startDate', isoStartDate);
      if (isoEndDate) queryParams.append('endDate', isoEndDate);

      debugger;
      
      if (filters.item) queryParams.append('item', filters.item);

      const response = await fetch(`http://localhost:5000/api/reviews?${queryParams.toString()}`);
      const data = await response.json();
      setReviews(data.reviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  // Handle form submit for filters
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReviews();
  };

  return (
    <Paper style={{ padding: 20 }}>
      <Typography variant="h4" gutterBottom>
        Run Query
      </Typography>

      <form onSubmit={handleSearch}>
        <Grid container spacing={2}>
          <Grid item xs={3}>
            <TextField
              fullWidth
              label="Restaurant"
              value={filters.restaurant}
              onChange={(e) => setFilters({ ...filters, restaurant: e.target.value })}
            />
          </Grid>
          <Grid item xs={3}>
            <TextField
              fullWidth
              label="Location"
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            />
          </Grid>
          <Grid item xs={3}>
            <TextField
              fullWidth
              label="Start Date (YYYY-MM-DD)"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
          </Grid>
          <Grid item xs={3}>
            <TextField
              fullWidth
              label="End Date (YYYY-MM-DD)"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </Grid>
          <Grid item xs={3}>
            <TextField
              fullWidth
              label="Item Ordered"
              value={filters.item}
              onChange={(e) => setFilters({ ...filters, item: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <Button variant="contained" color="primary" type="submit" fullWidth>
              Search
            </Button>
          </Grid>
        </Grid>
      </form>

      {reviews.length > 0 ? (
        <Table style={{ marginTop: 20 }}>
          <TableHead>
            <TableRow>
              <TableCell>Restaurant</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Date of Visit</TableCell>
              <TableCell>Items Ordered</TableCell>
              <TableCell>Ratings</TableCell>
              <TableCell>Overall Experience</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reviews.map((review) => (
              <TableRow key={review._id}>
                <TableCell>{review.restaurant}</TableCell>
                <TableCell>{review.location}</TableCell>
                <TableCell>{review.dateOfVisit}</TableCell>
                <TableCell>{review.itemsOrdered.join(', ')}</TableCell>
                <TableCell>{review.ratings.map((r: any) => `${r.item}: ${r.rating}`).join(', ')}</TableCell>
                <TableCell>{review.overallExperience}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <Typography>No reviews found for the given criteria.</Typography>
      )}
    </Paper>
  );
};

export default RunQuery;
