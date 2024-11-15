import React, { useEffect, useRef, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Collapse, Typography, Button, Slider, Popover, FormControlLabel, Checkbox, TextField, Switch, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import { GoogleGeometry, GooglePlaceResult, MemoRappReview } from '../types';
import '../App.css';
import { Autocomplete, Libraries, LoadScript } from '@react-google-maps/api';
import MapWithMarkers from '../components/MapWIthMarkers';
import { getCityNameFromPlace } from '../utilities';

import DirectionsIcon from '@mui/icons-material/Directions';
import MapIcon from '@mui/icons-material/Map';

interface Coordinates {
  lat: number;
  lng: number;
}

interface WouldReturnQuery {
  yes: boolean;
  no: boolean;
  notSpecified: boolean;
}

interface QueryParameters {
  lat?: number; lng?: number;
  radius?: number;
  restaurantName?: string;
  dateRange?: any;
  wouldReturn?: WouldReturnQuery;
  itemsOrdered?: any;
}

const DEFAULT_CENTER: Coordinates = { lat: 37.3944829, lng: -122.0790619 };

const ReviewsPage: React.FC = () => {
  const [expandedPlaceId, setExpandedPlaceId] = useState<string | null>(null);
  const [selectedReview, setSelectedReview] = useState<MemoRappReview | null>(null);
  const [wouldReturnFilter, setWouldReturnFilter] = useState<WouldReturnQuery>({
    yes: false,
    no: false,
    notSpecified: false,
  });
  const [anchorElWouldReturn, setAnchorElWouldReturn] = useState<HTMLElement | null>(null);
  const [query, setQuery] = useState<string>("");
  const [selectedPlaces, setSelectedPlaces] = useState<Set<string>>(new Set());
  const [showMap, setShowMap] = useState<boolean>(false);

  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);

  const [googlePlaces, setGooglePlaces] = useState<GooglePlaceResult[]>([]);

  const [memoRappReviews, setMemoRappReviews] = useState<MemoRappReview[]>([]);

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [specifiedLocation, setSpecifiedLocation] = useState<Coordinates>(DEFAULT_CENTER);

  const libraries = ['places'] as Libraries;

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => console.error("Error getting current location: ", error),
        { enableHighAccuracy: true }
      );
    }
  }, []);

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

  const handleShowMap = (placeId: string) => {
    const googlePlace: GooglePlaceResult | undefined = googlePlaces.find(place => place.place_id === placeId);
    if (googlePlace && googlePlace.geometry) {
      const geometry: GoogleGeometry = googlePlace.geometry!;
      setSpecifiedLocation(
        {
          lat: geometry.location.lat,
          lng: geometry.location.lng,
        }
      );
      setShowMap(true);
    }
  };

  const handleShowDirections = (placeId: string) => {
    const destination: GooglePlaceResult | undefined = googlePlaces.find(place => place.place_id === placeId);
    if (destination && currentLocation) {
      const destinationLocation: google.maps.LatLngLiteral = destination.geometry!.location;
      const destinationLatLng: google.maps.LatLngLiteral = { lat: destinationLocation.lat, lng: destinationLocation.lng };
      const url = `https://www.google.com/maps/dir/?api=1&origin=${currentLocation.lat},${currentLocation.lng}&destination=${destinationLatLng.lat},${destinationLatLng.lng}&destination_place_id=${destination.name}`;
      window.open(url, '_blank');
    }
  };

  const handleReviewClick = (review: MemoRappReview) => {
    setSelectedReview(review);
  };

  const handleFreeformQuery = async () => {
    console.log('Query:', query);
  }

  const handleWouldReturnSearch = async () => {
    const queryParameters: QueryParameters = {
      wouldReturn: { ...wouldReturnFilter },
    };
    try {
      const apiResponse = await fetch('/api/reviews/queryReviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(queryParameters), // Send the natural language query to your backend
      });
      const memoRappReviews: MemoRappReview[] = await apiResponse.json();
      console.log('Query results:', memoRappReviews);
      setMemoRappReviews(memoRappReviews);
    } catch (error) {
      console.error('Error handling query:', error);
    }
    handleWouldReturnClose();
  };

  const handleWouldReturnChange = (filter: keyof typeof wouldReturnFilter) => {
    setWouldReturnFilter((prev) => ({ ...prev, [filter]: !prev[filter] }));
  };

  const handleClearWouldReturnFilter = () => {
    setWouldReturnFilter({ yes: false, no: false, notSpecified: false });
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

  const getPlacesWithReviews = (): GooglePlaceResult[] => {
    return googlePlaces.filter((place: GooglePlaceResult) => memoRappReviews.some((review: MemoRappReview) => review.place_id === place.place_id));
  }

  const getReviewsForPlace = (placeId: string): MemoRappReview[] => {
    return memoRappReviews.filter((memoRappReview: MemoRappReview) => memoRappReview.place_id === placeId);
  };

  const handlePlaceChanged = () => {
    if (autocompleteRef.current) {
      const place: google.maps.places.PlaceResult = autocompleteRef.current.getPlace();
      if (place.geometry !== undefined) {
        const geometry: google.maps.places.PlaceGeometry = place.geometry!;
        setSpecifiedLocation(
          {
            lat: geometry.location!.lat(),
            lng: geometry.location!.lng(),
          }
        );
        console.log("Place changed:", place);
      }
    }
  };

  const handleInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value.trim().toLowerCase();

    if (inputValue === "current location") {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setSpecifiedLocation(
              {
                lat: latitude,
                lng: longitude,
              }
            );
            console.log("Current Location Coordinates:", { latitude, longitude });

            // Optionally, you can use reverse geocoding here to convert coordinates to an address
          },
          (error) => {
            console.error("Error retrieving current location:", error);
          }
        );
      } else {
        console.error("Geolocation is not supported by this browser.");
      }
    }
  };

  const togglePanel = (_: React.MouseEvent<HTMLElement>, newView: string | null) => {
    if (newView === "map") {
      setShowMap(true);
    } else if (newView === "details") {
      setShowMap(false);
    }
  };


  const renderMap = () => {
    return (
      <MapWithMarkers
        initialCenter={specifiedLocation}
        locations={googlePlaces}
      />
    );
  }

  return (
    <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY!} libraries={libraries}>
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
          <Button variant="contained" color="primary" onClick={handleFreeformQuery}>
            Search
          </Button>
        </div>

        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Button variant="outlined" aria-describedby={anchorElWouldReturn ? 'would-return-popover' : undefined} onClick={handleWouldReturnClick}>
            Would Return
          </Button>
          <Autocomplete
            onLoad={(autocomplete) => (autocompleteRef.current = autocomplete)}
            onPlaceChanged={handlePlaceChanged}
          >
            <input
              type="text"
              placeholder="Enter the location"
              onChange={handleInputChange} // Custom input handling
              style={{ width: '100%', padding: '10px', boxSizing: 'border-box' }}
            />
            {/* <TextField
                  fullWidth
                  label="Restaurant Name"
                  value={restaurantLabel}
                  onChange={(e) => setRestaurantLabel(e.target.value)}
                  placeholder="Enter the restaurant name"
                  required
                  style={{ marginBottom: 20 }}
                /> */}
          </Autocomplete>
          <ToggleButtonGroup
            value={showMap ? "map" : "details"}
            exclusive
            onChange={togglePanel}
            style={{ marginBottom: '10px', display: 'flex', justifyContent: 'center' }}
          >
            <ToggleButton value="map" aria-label="Map">
              Map
            </ToggleButton>
            <ToggleButton value="details" aria-label="Review Details">
              Review Details
            </ToggleButton>
          </ToggleButtonGroup>

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
                    color: 'black',
                    borderColor: 'black',
                    height: 'fit-content', // Adjusts height to match the checkbox labels
                  }}
                >
                  Clear
                </Button>
              </div>
              <Button
                variant="contained"
                color="primary"
                onClick={handleWouldReturnSearch} // Ensure you have this function defined to handle the search
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
                  <TableCell align="center"></TableCell>
                  <TableCell align="center"></TableCell>
                  <TableCell>Place</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell align="center"></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getPlacesWithReviews().map((place: GooglePlaceResult) => (
                  <React.Fragment key={place.place_id}>
                    <TableRow className="table-row-hover">
                      <TableCell align="center" className="dimmed" style={{ maxWidth: '30px', padding: '0px', textAlign: 'center' }}>
                        <Checkbox style={{ maxWidth: '30px', padding: '0px', textAlign: 'center' }}
                          checked={selectedPlaces.has(place.place_id)}
                          onChange={() => handlePlaceSelect(place.place_id)}
                        />
                      </TableCell>
                      <TableCell align="right" className="dimmed" style={{ maxWidth: '30px', padding: '0px', textAlign: 'center' }}>
                        <IconButton onClick={() => handleShowMap(place.place_id)} style={{ maxWidth: '30px', padding: '0px', textAlign: 'center'  }}>
                          <MapIcon />
                        </IconButton>
                      </TableCell>
                      <TableCell align="right" className="dimmed" style={{ maxWidth: '30px', padding: '0px', textAlign: 'center'  }}>
                        <IconButton onClick={() => handleShowDirections(place.place_id)} style={{ maxWidth: '30px', padding: '0px', textAlign: 'center'  }}>
                          <DirectionsIcon />
                        </IconButton>
                      </TableCell>
                      <TableCell>{place.name}</TableCell>
                      <TableCell>{getCityNameFromPlace(place) || 'Not provided'}</TableCell>
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
                                  <TableCell>
                                    Would Return: {review.structuredReviewProperties.wouldReturn === null ? 'Not Specified' : review.structuredReviewProperties.wouldReturn ? 'Yes' : 'No'}
                                  </TableCell>
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
            <Paper id='mapContainer' className="map-container">
              {renderMap()}
            </Paper>
          ) : (
            selectedReview && (
              <Paper id='reviewDetails' className="review-details">
                <Typography variant="h6">Review Details</Typography>
                <Typography><strong>Date of Visit:</strong> {selectedReview.structuredReviewProperties.dateOfVisit}</Typography>
                <Typography><strong>Would Return:</strong> {selectedReview.structuredReviewProperties.wouldReturn ? 'Yes' : 'No'}</Typography>
                <Typography><strong>Review Text:</strong> {selectedReview.freeformReviewProperties.reviewText}</Typography>
              </Paper>
            )
          )}
        </div>
      </div>
    </LoadScript>
  );
};

export default ReviewsPage;
