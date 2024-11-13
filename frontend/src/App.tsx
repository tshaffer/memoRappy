import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Container } from '@mui/material';
import ReviewForm from './pages/ReviewForm';
import ViewReviews from './pages/ViewReviews';
import QueryReviews from './pages/QueryReviews';
import Reviews from './pages/Reviews';
import './App.css';

const App: React.FC = () => {
  return (
    <Router>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            MemoRapp
          </Typography>
          <Button color="inherit" component={Link} to="/">Reviews</Button>
          <Button color="inherit" component={Link} to="/view-reviews">View Reviews</Button>
          <Button color="inherit" component={Link} to="/query-reviews">Query Reviews</Button>
          <Button color="inherit" component={Link} to="/add-review">Add Review</Button>
        </Toolbar>
      </AppBar>
      <Container className="full-width-container">
        <Routes>
          <Route path="/" element={<Reviews />} />
          <Route path="/view-reviews" element={<ViewReviews />} />
          <Route path="/query-reviews" element={<QueryReviews />} />
          <Route path="/add-review" element={<ReviewForm />} />
          <Route path="/add-review/:_id" element={<ReviewForm />} />
        </Routes>
      </Container>
    </Router>
  );
};

export default App;
