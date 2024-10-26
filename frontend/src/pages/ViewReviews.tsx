import React, { useEffect, useState } from 'react';
import { Typography, Paper, Table, TableHead, TableBody, TableCell, TableRow, Button, Grid } from '@mui/material';

const ViewReviews: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);

  // Fetch reviews from the backend
  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/reviews');
      const data = await response.json();
      setReviews(data.reviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  // Fetch reviews when the component mounts
  useEffect(() => {
    fetchReviews();
  }, []);

  return (
    <Paper style={{ padding: 20 }}>
      <Typography variant="h4" gutterBottom>
        View Reviews
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Button variant="contained" color="primary" onClick={fetchReviews} fullWidth>
            Refresh Reviews
          </Button>
        </Grid>
      </Grid>

      {reviews.length > 0 ? (
        <div style={{ overflowX: 'auto', marginTop: 20 }}>
          <Table>
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
                  <TableCell>{review.restaurantName}</TableCell>
                  <TableCell>{review.location}</TableCell>
                  <TableCell>{new Date(review.dateOfVisit).toLocaleDateString()}</TableCell>
                  <TableCell>{review.itemsOrdered.join(', ')}</TableCell>
                  <TableCell>
                    {review.ratings.map((r: any) => (
                      <div key={r.item}>
                        {r.item}: {r.rating}
                      </div>
                    ))}
                  </TableCell>
                  <TableCell>{review.overallExperience}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <Typography>No reviews found.</Typography>
      )}
    </Paper>
  );
};

export default ViewReviews;
