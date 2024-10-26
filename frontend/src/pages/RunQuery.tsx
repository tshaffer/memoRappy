import React, { useEffect, useState } from 'react';
import { TextField, Button, Typography, Paper, Grid, Table, TableHead, TableBody, TableCell, TableRow } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { Theme } from '@mui/material/styles'; // Import Theme from Material-UI

const useStyles = makeStyles((theme: Theme) => ({
  tableCell: {
    [theme.breakpoints.down('sm')]: {
      fontSize: '0.8rem', // Smaller font size on small screens
    },
  },
}));

const RunQuery: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    restaurantName: '',
    location: '',
    startDate: '',
    endDate: '',
    item: '',
  });

  const classes = useStyles();

  // Convert date to ISO format (if available)
  const convertToISO = (date: string) => {
    return date ? new Date(date).toISOString() : '';
  };

  // Fetch reviews from the backend
  const fetchReviews = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.restaurantName) queryParams.append('restaurantName', filters.restaurantName);
      if (filters.location) queryParams.append('location', filters.location);

      // Convert startDate and endDate to ISO format
      const isoStartDate = convertToISO(filters.startDate);
      const isoEndDate = convertToISO(filters.endDate);

      if (isoStartDate) queryParams.append('startDate', isoStartDate);
      if (isoEndDate) queryParams.append('endDate', isoEndDate);

      if (filters.item) queryParams.append('item', filters.item);

      const response = await fetch(`/api/reviews?${queryParams.toString()}`);
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
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Restaurant"
              value={filters.restaurantName}
              onChange={(e) => setFilters({ ...filters, restaurantName: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Location"
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Start Date (YYYY-MM-DD)"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="End Date (YYYY-MM-DD)"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
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
        <div style={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell className={classes.tableCell}>Restaurant</TableCell>
                <TableCell className={classes.tableCell}>Location</TableCell>
                <TableCell className={classes.tableCell}>Date of Visit</TableCell>
                <TableCell className={classes.tableCell}>Items Ordered</TableCell>
                <TableCell className={classes.tableCell}>Ratings</TableCell>
                <TableCell className={classes.tableCell}>Overall Experience</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reviews.map((review) => (
                <TableRow key={review._id}>
                  <TableCell className={classes.tableCell}>{review.restaurantName}</TableCell>
                  <TableCell className={classes.tableCell}>{review.location}</TableCell>
                  <TableCell className={classes.tableCell}>{review.dateOfVisit}</TableCell>
                  <TableCell className={classes.tableCell}>{review.itemsOrdered.join(', ')}</TableCell>
                  <TableCell className={classes.tableCell}>{review.ratings.map((r: any) => `${r.item}: ${r.rating}`).join(', ')}</TableCell>
                  <TableCell className={classes.tableCell}>{review.overallExperience}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <Typography>No reviews found for the given criteria.</Typography>
      )}
    </Paper>
  );
};

export default RunQuery;
