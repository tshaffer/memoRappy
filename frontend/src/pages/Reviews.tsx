import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Collapse, Typography, Button, Slider, Popover, FormControlLabel, Checkbox, TextField } from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import { GooglePlaceResult, MemoRappReview } from '../types';
import '../App.css'; // Ensure App.css contains the required classes

const ReviewsPage: React.FC = () => {
  const [expandedPlaceId, setExpandedPlaceId] = useState<string | null>(null);
  const [wouldReturnFilter, setWouldReturnFilter] = useState<{ yes: boolean; no: boolean; notSpecified: boolean }>({
    yes: false,
    no: false,
    notSpecified: false,
  });
  const [distance, setDistance] = useState<number>(10);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [anchorElWouldReturn, setAnchorElWouldReturn] = useState<HTMLElement | null>(null);
  const [query, setQuery] = useState<string>("");

  const [googlePlaces, setGooglePlaces] = useState<GooglePlaceResult[]>([]);
  const [memoRappReviews, setMemoRappReviews] = useState<MemoRappReview[]>([]);

  useEffect(() => {
    const fetchPlaces = async () => {
      const response = await fetch('/api/places');
      const data = await response.json();
      const googlePlaces: GooglePlaceResult[] = data.googlePlaces;
      console.log('GooglePlaces:', googlePlaces);
      setGooglePlaces(googlePlaces);
    }
    const fetchReviews = async () => {
      const response = await fetch('/api/reviews');
      const data = await response.json();
      const memoRappReviews: MemoRappReview[] = data.memoRappReviews;
      console.log('MemoRappReviews:', memoRappReviews);
      setMemoRappReviews(memoRappReviews);
    }
    fetchPlaces();
    fetchReviews();

    // Get the user's current location
    // navigator.geolocation.getCurrentPosition(
    //   (position) => {
    //     setCurrentLocation({
    //       lat: position.coords.latitude,
    //       lng: position.coords.longitude,
    //     });
    //   },
    //   (error) => console.error('Error getting current location:', error)
    // );
  }, []);

  const handleExpandClick = (placeId: string) => {
    setExpandedPlaceId(expandedPlaceId === placeId ? null : placeId);
  };

  const handleWouldReturnChange = (filter: keyof typeof wouldReturnFilter) => {
    setWouldReturnFilter((prev) => ({ ...prev, [filter]: !prev[filter] }));
  };

  const handleClearWouldReturnFilter = () => {
    setWouldReturnFilter({ yes: false, no: false, notSpecified: false });
  };

  const handleDistanceSliderChange = (event: Event, newValue: number | number[]) => {
    setDistance(newValue as number);
  };

  const handleDistanceClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleDistanceClose = () => {
    setAnchorEl(null);
  };

  const handleWouldReturnClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElWouldReturn(event.currentTarget);
  };

  const handleWouldReturnClose = () => {
    setAnchorElWouldReturn(null);
  };

  const handleQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  const handleSearch = () => {
    console.log("Searching for query:", query);
  };

  const openDistance = Boolean(anchorEl);
  const idDistance = openDistance ? 'distance-popover' : undefined;

  const openWouldReturn = Boolean(anchorElWouldReturn);
  const idWouldReturn = openWouldReturn ? 'would-return-popover' : undefined;

  const getReviewsForPlace = (placeId: string): MemoRappReview[] => {
    return memoRappReviews.filter((memoRappReview: MemoRappReview) => memoRappReview.place_id === placeId);
  }

  return (
    <div className="page-container">
      {/* Freeform Query Input */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <TextField
          label="Enter query"
          variant="outlined"
          value={query}
          onChange={handleQueryChange}
          size="small"
          style={{ flex: 1 }}
        />
        <Button variant="contained" color="primary" onClick={handleSearch}>
          Search
        </Button>
      </div>

      {/* Filtering UI */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <div>
          <Button variant="outlined" aria-describedby={openWouldReturn ? 'would-return-popover' : undefined} onClick={handleWouldReturnClick}>
            Would Return
          </Button>
          <Popover
            open={Boolean(anchorElWouldReturn)}
            anchorEl={anchorElWouldReturn}
            onClose={handleWouldReturnClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          >
            <div style={{ padding: '20px' }}>
              <Typography variant="subtitle1">Would Return</Typography>
              <FormControlLabel control={<Checkbox checked={wouldReturnFilter.yes} onChange={() => handleWouldReturnChange('yes')} />} label="Yes" />
              <FormControlLabel control={<Checkbox checked={wouldReturnFilter.no} onChange={() => handleWouldReturnChange('no')} />} label="No" />
              <FormControlLabel control={<Checkbox checked={wouldReturnFilter.notSpecified} onChange={() => handleWouldReturnChange('notSpecified')} />} label="Not Specified" />
              <Button variant="outlined" size="small" onClick={handleClearWouldReturnFilter} style={{ marginTop: '10px' }}>Clear</Button>
            </div>
          </Popover>
        </div>
        <div>
          <Button variant="outlined" aria-describedby={openDistance ? 'distance-popover' : undefined} onClick={handleDistanceClick}>
            Distance: {distance} miles
          </Button>
          <Popover
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={handleDistanceClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          >
            <div style={{ padding: '20px' }}>
              <Typography variant="subtitle1">Select Distance</Typography>
              <Slider value={distance} onChange={handleDistanceSliderChange} min={1} max={100} valueLabelDisplay="auto" />
            </div>
          </Popover>
        </div>
      </div>

      {/* Scrollable TableContainer */}
      <TableContainer component={Paper} className="scrollable-table-container">
        <Table stickyHeader>
          <TableHead>
            <TableRow className="table-head-fixed">
              <TableCell>Place</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {googlePlaces.map((place: GooglePlaceResult) => (
              <React.Fragment key={place.place_id}>
                <TableRow>
                  <TableCell>{place.name}</TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => handleExpandClick(place.place_id)}>
                      {expandedPlaceId === place.place_id ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={2} style={{ padding: 0 }}>
                    <Collapse in={expandedPlaceId === place.place_id} timeout="auto" unmountOnExit>
                      <Table size="small">
                        <TableBody>
                          {getReviewsForPlace(place.place_id).map((review) => (
                            <TableRow key={review._id}>
                              <TableCell>Date: {review.structuredReviewProperties.dateOfVisit}</TableCell>
                              <TableCell>Would Return: {review.structuredReviewProperties.wouldReturn === null ? 'Not Specified' : review.structuredReviewProperties.wouldReturn ? 'Yes' : 'No'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default ReviewsPage;
