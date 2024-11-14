import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Collapse, Typography, Button, Slider, Popover, FormControlLabel, Checkbox, TextField } from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import { GooglePlaceResult, MemoRappReview } from '../types';
import '../App.css';
// Import Google Maps components
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import MapWithMarkers from '../components/MapWIthMarkers';

const ReviewsPage: React.FC = () => {
  const [expandedPlaceId, setExpandedPlaceId] = useState<string | null>(null);
  const [selectedReview, setSelectedReview] = useState<MemoRappReview | null>(null);
  const [wouldReturnFilter, setWouldReturnFilter] = useState<{ yes: boolean; no: boolean; notSpecified: boolean }>({
    yes: false,
    no: false,
    notSpecified: false,
  });
  const [distance, setDistance] = useState<number>(10);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [anchorElWouldReturn, setAnchorElWouldReturn] = useState<HTMLElement | null>(null);
  const [query, setQuery] = useState<string>("");
  const [selectedPlaces, setSelectedPlaces] = useState<Set<string>>(new Set());
  const [showMap, setShowMap] = useState<boolean>(false);

  const [googlePlaces, setGooglePlaces] = useState<GooglePlaceResult[]>([]);
  const [googlePlacesSelected, setGooglePlacesSelected] = useState<GooglePlaceResult[]>([]);

  const [memoRappReviews, setMemoRappReviews] = useState<MemoRappReview[]>([]);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '', // Ensure your API key is loaded
  });

  useEffect(() => {
    const fetchPlaces = async () => {
      const response = await fetch('/api/places');
      const data = await response.json();
      setGooglePlaces(data.googlePlaces);
    };
    const fetchReviews = async () => {
      const response = await fetch('/api/reviews');
      const data = await response.json();
      setMemoRappReviews(data.memoRappReviews);
    };
    fetchPlaces();
    fetchReviews();
  }, []);

  const handleExpandClick = (placeId: string) => {
    setExpandedPlaceId(expandedPlaceId === placeId ? null : placeId);
  };

  const handleReviewClick = (review: MemoRappReview) => {
    setSelectedReview(review);
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

  const toggleMapDisplay = () => {
    const mapCurrentlyDisplayed = showMap;
    const newShowMap = !mapCurrentlyDisplayed;
    if (newShowMap) {
      const googlePlacesSelected: GooglePlaceResult[] = googlePlaces.filter((place) => selectedPlaces.has(place.place_id));
      setGooglePlacesSelected(googlePlacesSelected);
    } else {
      setGooglePlacesSelected([]);
    }
    setShowMap((prev) => !prev);
  };

  const handlePlaceSelect = (placeId: string) => {
    setSelectedPlaces((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(placeId)) {
        newSet.delete(placeId);
      } else {
        newSet.add(placeId);
      }
      return newSet;
    });
  };

  const getReviewsForPlace = (placeId: string): MemoRappReview[] => {
    return memoRappReviews.filter((memoRappReview: MemoRappReview) => memoRappReview.place_id === placeId);
  };

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
        <Button variant="outlined" onClick={toggleMapDisplay}>
          Display Map
        </Button>
        <Button variant="outlined" aria-describedby={anchorElWouldReturn ? 'would-return-popover' : undefined} onClick={handleWouldReturnClick}>
          Would Return
        </Button>
        <Popover
          open={Boolean(anchorElWouldReturn)}
          anchorEl={anchorElWouldReturn}
          onClose={handleWouldReturnClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle1" gutterBottom>
              Would Return
            </Typography>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FormControlLabel
                control={<Checkbox checked={wouldReturnFilter.yes} onChange={() => handleWouldReturnChange('yes')} />}
                label="Yes"
              />
              <FormControlLabel
                control={<Checkbox checked={wouldReturnFilter.no} onChange={() => handleWouldReturnChange('no')} />}
                label="No"
              />
              <FormControlLabel
                control={<Checkbox checked={wouldReturnFilter.notSpecified} onChange={() => handleWouldReturnChange('notSpecified')} />}
                label="Not Specified"
              />
              <Button
                variant="outlined"
                size="small"
                onClick={handleClearWouldReturnFilter}
                style={{
                  marginTop: '10px',
                  color: 'black',
                  borderColor: 'black',
                  alignSelf: 'center' // Centers Clear button with checkbox labels
                }}
              >
                Clear
              </Button>
            </div>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSearch} // Ensure you have this function defined to handle the search
              style={{ alignSelf: 'flex-end', marginTop: '10px' }}
            >
              Search
            </Button>
          </div>
        </Popover>
      </div>

      <div className="table-and-details-container">
        <TableContainer component={Paper} className="scrollable-table-container">
          <Table stickyHeader>
            <TableHead>
              <TableRow className="table-head-fixed">
                <TableCell align="center"></TableCell>
                <TableCell>Place</TableCell>
                <TableCell align="center"></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {googlePlaces.map((place: GooglePlaceResult) => (
                <React.Fragment key={place.place_id}>
                  <TableRow>
                    <TableCell align="center">
                      <Checkbox
                        checked={selectedPlaces.has(place.place_id)}
                        onChange={() => handlePlaceSelect(place.place_id)}
                      />
                    </TableCell>
                    <TableCell>{place.name}</TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => handleExpandClick(place.place_id)}>
                        {expandedPlaceId === place.place_id ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={3} style={{ padding: 0 }}>
                      <Collapse in={expandedPlaceId === place.place_id} timeout="auto" unmountOnExit>
                        <Table size="small">
                          <TableBody>
                            {getReviewsForPlace(place.place_id).map((review) => (
                              <TableRow key={review._id} onClick={() => handleReviewClick(review)} style={{ cursor: 'pointer' }}>
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

        {showMap ? (
          <Paper className="map-container">
            <MapWithMarkers
              locations={googlePlacesSelected}
            />
          </Paper>
        ) : (
          selectedReview && (
            <Paper className="review-details">
              <Typography variant="h6">Review Details</Typography>
              <Typography><strong>Date of Visit:</strong> {selectedReview.structuredReviewProperties.dateOfVisit}</Typography>
              <Typography><strong>Would Return:</strong> {selectedReview.structuredReviewProperties.wouldReturn ? 'Yes' : 'No'}</Typography>
              <Typography><strong>Review Text:</strong> {selectedReview.freeformReviewProperties.reviewText}</Typography>
            </Paper>
          )
        )}
      </div>
    </div>
  );
};

export default ReviewsPage;
