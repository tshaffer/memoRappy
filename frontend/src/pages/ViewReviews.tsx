import React, { useEffect, useState } from 'react';
import { Typography, Paper, Table, TableHead, TableBody, TableCell, TableRow, Button } from '@mui/material';

const ViewReviews: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);

  // Fetch reviews from the backend
  const fetchReviews = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/reviews');
      const data = await response.json();
      setReviews(data.reviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  // Fetch reviews on component mount
  useEffect(() => {
    fetchReviews();
  }, []);

  return (
    <Paper style={{ padding: 20 }}>
      <Typography variant="h4" gutterBottom>
        View Reviews
      </Typography>

      {reviews.length > 0 ? (
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
        <Typography>No reviews found.</Typography>
      )}

      <Button variant="contained" color="primary" onClick={fetchReviews}>
        Refresh Reviews
      </Button>
    </Paper>
  );
};

export default ViewReviews;
