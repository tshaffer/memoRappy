// ViewReviews.tsx

import React, { useEffect, useState } from 'react';
import { Typography, List, ListItemText, Card, CardContent, Divider, Grid, ListItemButton } from '@mui/material';
import { ReviewEntityWithFullText } from '../types';

const ViewReviews: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewEntityWithFullText[]>([]);
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

  return (
    <Grid container spacing={2} style={{ padding: 20 }}>
      {/* Master view - list of reviews */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>Reviews</Typography>
            <List>
              {reviews.map((review, index) => (
                <React.Fragment key={index}>
                  <ListItemButton
                    onClick={() => setSelectedReview(review)}
                    selected={selectedReview === review}
                  >
                    <ListItemText
                      primary={review.restaurantName}
                      secondary={`Overall Experience: ${review.overallExperience}`}
                    />
                  </ListItemButton>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>

      {/* Detail view - details of the selected review */}
      <Grid item xs={12} md={8}>
        {selectedReview ? (
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>{selectedReview.restaurantName}</Typography>
              <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                {selectedReview.dateOfVisit}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Reviewer:</strong> {selectedReview.reviewer}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Overall Experience:</strong> {selectedReview.overallExperience}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Items Ordered:</strong>
              </Typography>
              <ul>
                {selectedReview.itemsOrdered.map((item, idx) => (
                  <li key={idx}>
                    {item} - {selectedReview.ratings[idx]?.rating || 'No rating provided'}
                  </li>
                ))}
              </ul>
              <Typography variant="body1" gutterBottom>
                <strong>Review:</strong> {selectedReview.reviewText}
              </Typography>
              {selectedReview.googleLocation && (
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  <strong>Location:</strong> {selectedReview.googleLocation.address}
                </Typography>
              )}
            </CardContent>
          </Card>
        ) : (
          <Typography variant="body1">Select a review to see details.</Typography>
        )}
      </Grid>
    </Grid>
  );
};

export default ViewReviews;
