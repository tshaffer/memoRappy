import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import AddReview from './pages/AddReview';
import ReviewList from './pages/ReviewList';
import QueryPage from './pages/QueryPage';
import { AppBar, Toolbar, Typography, Button, Container } from '@mui/material';

const App: React.FC = () => {
  return (
    <Router>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            MemoRapp
          </Typography>
          <Button color="inherit" component={Link} to="/">Home</Button>
          <Button color="inherit" component={Link} to="/add-review">Add Review</Button>
          <Button color="inherit" component={Link} to="/review-list">View Reviews</Button>
          <Button color="inherit" component={Link} to="/query">Run Query</Button>
        </Toolbar>
      </AppBar>
      <Container style={{ marginTop: '20px' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/add-review" element={<AddReview />} />
          <Route path="/review-list" element={<ReviewList />} />
          <Route path="/query" element={<QueryPage />} />
        </Routes>
      </Container>
    </Router>
  );
};

export default App;
