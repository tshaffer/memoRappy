import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Container } from '@mui/material';
import Home from './pages/Home';
import AddReview from './pages/AddReview';
import ViewReviews from './pages/ViewReviews';
import QueryReviews from './pages/QueryReviews';

const App: React.FC = () => {
  return (
    <Router>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            MemoRapp
          </Typography>
          <Button color="inherit" component={Link} to="/">Home</Button>
          <Button color="inherit" component={Link} to="/view-reviews">View Reviews</Button>
          <Button color="inherit" component={Link} to="/query-reviews">Query Reviews</Button>
          <Button color="inherit" component={Link} to="/add-review">Add Review</Button>
        </Toolbar>
      </AppBar>
      <Container style={{ marginTop: '20px' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/view-reviews" element={<ViewReviews />} />
          <Route path="/query-reviews" element={<QueryReviews />} />
          <Route path="/add-review" element={<AddReview />} />
          <Route path="/add-review/:_id" element={<AddReview />} />
        </Routes>
      </Container>
    </Router>
  );
};

export default App;
