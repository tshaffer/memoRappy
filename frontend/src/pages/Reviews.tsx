import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Typography, Button, Popover, FormControlLabel, Checkbox, TextField, ToggleButton, ToggleButtonGroup, Slider, Switch, Radio } from '@mui/material';
import { Coordinates, FilterQueryParams, FilterResponse, GoogleGeometry, GooglePlace, MemoRappReview, QueryRequestBody, WouldReturnQuery } from '../types';
import '../App.css';
import { Autocomplete, Libraries, LoadScript } from '@react-google-maps/api';
import MapWithMarkers from '../components/MapWIthMarkers';
import { getCityNameFromPlace } from '../utilities';

import DirectionsIcon from '@mui/icons-material/Directions';
import MapIcon from '@mui/icons-material/Map';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';

interface WouldReturnCounts {
  yesCount: number;
  noCount: number;
  nullCount: number;
}

const DEFAULT_CENTER: Coordinates = { lat: 37.3944829, lng: -122.0790619 };

const smallColumnStyle: React.CSSProperties = {
  width: '35px',
  maxWidth: '35px',
  textAlign: 'center',
  padding: '0',
};

const thumbsStyle: React.CSSProperties = {
  width: '60px',
  maxWidth: '60px',
  textAlign: 'center',
  padding: '0',
};

const ReviewsPage: React.FC = () => {

  const navigate = useNavigate();

  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);

  const [reviews, setReviews] = useState<MemoRappReview[]>([]);
  const [places, setPlaces] = useState<GooglePlace[]>([]);

  const [filteredPlaces, setFilteredPlaces] = useState<GooglePlace[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<MemoRappReview[]>([]);

  const [query, setQuery] = useState<string>("");

  const [anchorElSetDistance, setAnchorElSetDistance] = useState<HTMLElement | null>(null);
  const [distanceFilterEnabled, setDistanceFilterEnabled] = useState(false);
  const [fromLocation, setFromLocation] = useState<'current' | 'specified'>('current');
  const [fromLocationLocation, setFromLocationLocation] = useState<Coordinates>(DEFAULT_CENTER);
  const [fromLocationDistance, setFromLocationDistance] = useState(5);
  const fromLocationAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const [anchorElWouldReturn, setAnchorElWouldReturn] = useState<HTMLElement | null>(null);
  const [wouldReturnFilter, setWouldReturnFilter] = useState<WouldReturnQuery>({
    yes: false,
    no: false,
    notSpecified: false,
  });

  const [selectedPlace, setSelectedPlace] = useState<GooglePlace | null>(null);

  const [areaMapLocation, setAreaMapLocation] = useState<Coordinates>(DEFAULT_CENTER);
  const [showAreaMap, setShowAreaMap] = useState<boolean>(false);
  const areaMapAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

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
      setPlaces(data.googlePlaces);
      setFilteredPlaces(data.googlePlaces);
    };
    const fetchReviews = async () => {
      const response = await fetch('/api/reviews');
      const data = await response.json();
      setReviews(data.memoRappReviews);
      setFilteredReviews(data.memoRappReviews);
    };
    fetchPlaces();
    fetchReviews();
  }, []);

  const getPlaceById = (placeId: string): GooglePlace | undefined => {
    return places.find((place: GooglePlace) => place.place_id === placeId);
  }

  const getFilteredReviewsForPlace = (placeId: string): MemoRappReview[] => {
    return filteredReviews.filter((memoRappReview: MemoRappReview) => memoRappReview.place_id === placeId);
  };

  const getWouldReturnToPlaceCounts = (placeId: string): WouldReturnCounts => {
    const counts: WouldReturnCounts = {
      yesCount: 0,
      noCount: 0,
      nullCount: 0,
    };

    reviews.forEach((memoRappReview: MemoRappReview) => {
      if (memoRappReview.place_id === placeId) {
        const wouldReturn = memoRappReview.structuredReviewProperties.wouldReturn;

        if (wouldReturn === true) {
          counts.yesCount += 1;
        } else if (wouldReturn === false) {
          counts.noCount += 1;
        } else {
          counts.nullCount += 1;
        }
      }
    });

    return counts;
  };

  const handleQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  const handleNaturalLanguageQuery = async () => {

    console.log('Query:', query);

    const queryRequestBody: QueryRequestBody = {
      query,
    };

    try {
      const apiResponse = await fetch('/api/reviews/naturalLanguageQuery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(queryRequestBody),
      });
      const data = await apiResponse.json();
      console.log('Natural language query results:', data);
      const { places, reviews } = data.result;
      setPlaces(places);
      setFilteredPlaces(places);
      setReviews(reviews);
      setFilteredReviews(reviews);
    } catch (error) {
      console.error('Error handling query:', error);
    }
  }

  const handleDistanceClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElSetDistance(event.currentTarget);
  };

  const handleDistanceFilterToggle = () => {
    setDistanceFilterEnabled((prev) => !prev);
  };

  const handleDistanceSliderChange = (event: Event, newValue: number | number[]) => {
    setFromLocationDistance(newValue as number);
  };

  const handleFromLocationPlaceChanged = () => {
    if (fromLocationAutocompleteRef.current) {
      const place: google.maps.places.PlaceResult = fromLocationAutocompleteRef.current.getPlace();
      if (place.geometry !== undefined) {
        const geometry: google.maps.places.PlaceGeometry = place.geometry!;
        setFromLocationLocation(
          {
            lat: geometry.location!.lat(),
            lng: geometry.location!.lng(),
          }
        );
        console.log("From location place changed:", place);
      }
    }
  };

  const handleDistanceClose = () => {
    setAnchorElSetDistance(null);
  };

  const handleWouldReturnClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElWouldReturn(event.currentTarget);
  };

  const handleWouldReturnChange = (filter: keyof typeof wouldReturnFilter) => {
    setWouldReturnFilter((prev) => ({ ...prev, [filter]: !prev[filter] }));
  };

  const handleClearWouldReturnFilter = () => {
    setWouldReturnFilter({ yes: false, no: false, notSpecified: false });
  };

  const handleWouldReturnClose = () => {
    setAnchorElWouldReturn(null);
  };

  const handleSearchByFilter = async () => {
    console.log('handleSearchByFilter');

    let lat: number | undefined = undefined;
    let lng: number | undefined = undefined;

    if (distanceFilterEnabled) {
      if (fromLocation === 'current') {
        lat = currentLocation!.lat;
        lng = currentLocation!.lng;
      } else {
        lat = fromLocationLocation.lat;
        lng = fromLocationLocation.lng;
      }
    }

    const wouldReturn: WouldReturnQuery | undefined = wouldReturnFilter.yes || wouldReturnFilter.no || wouldReturnFilter.notSpecified ? wouldReturnFilter : undefined;

    const filterQueryParams: FilterQueryParams = {
      distanceAwayQuery: distanceFilterEnabled ? { lat: lat!, lng: lng!, radius: fromLocationDistance } : undefined,
      wouldReturn,
    };

    try {
      const apiResponse = await fetch('/api/reviews/filterReviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filterQueryParams),
      });
      const data: FilterResponse = await apiResponse.json();
      console.log('Filter query results:', data);
      setFilteredPlaces(data.places);
      setFilteredReviews(data.reviews);
    } catch (error) {
      console.error('Error handling query:', error);
    }
  };

  const handlePlaceClick = (place: GooglePlace) => {
    setSelectedPlace(place);
  }

  const handleShowMap = (placeId: string) => {
    const googlePlace: GooglePlace | undefined = places.find(place => place.place_id === placeId);
    if (googlePlace && googlePlace.geometry) {
      const geometry: GoogleGeometry = googlePlace.geometry!;
      setAreaMapLocation(
        {
          lat: geometry.location.lat,
          lng: geometry.location.lng,
        }
      );
      setShowAreaMap(true);
    }
  };

  const handleShowDirections = (placeId: string) => {
    const destination: GooglePlace | undefined = places.find(place => place.place_id === placeId);
    if (destination && currentLocation) {
      const destinationLocation: google.maps.LatLngLiteral = destination.geometry!.location;
      const destinationLatLng: google.maps.LatLngLiteral = { lat: destinationLocation.lat, lng: destinationLocation.lng };
      const url = `https://www.google.com/maps/dir/?api=1&origin=${currentLocation.lat},${currentLocation.lng}&destination=${destinationLatLng.lat},${destinationLatLng.lng}&destination_place_id=${destination.name}`;
      window.open(url, '_blank');
    }
  };

  const handleTogglePanel = (_: React.MouseEvent<HTMLElement>, newView: string | null) => {
    if (newView === "map") {
      setShowAreaMap(true);
    } else if (newView === "details") {
      setShowAreaMap(false);
    }
  };

  const handleEditReview = (review: MemoRappReview) => {
    debugger;
    console.log('handleEditReview', review);
    const place: GooglePlace | undefined = getPlaceById(review.place_id);
    if (!place) {
      console.error('Place not found for review:', review);
      return;
    }
    navigate(`/add-review/${review._id}`, { state: { place, review } });
  }

  const handlePlaceChanged = () => {
    if (areaMapAutocompleteRef.current) {
      const place: google.maps.places.PlaceResult = areaMapAutocompleteRef.current.getPlace();
      if (place.geometry !== undefined) {
        const geometry: google.maps.places.PlaceGeometry = place.geometry!;
        const newCoordinates: Coordinates = {
          lat: geometry.location!.lat(),
          lng: geometry.location!.lng(),
        };
        setAreaMapLocation(newCoordinates);
        console.log("Place changed:", place, newCoordinates);
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
            setAreaMapLocation(
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

  const renderMap = () => {
    return (
      <MapWithMarkers
        key={JSON.stringify({ googlePlaces: places, specifiedLocation: areaMapLocation })} // Forces re-render on prop change
        initialCenter={areaMapLocation}
        locations={places}
      />
    );
  };

  const renderReviewDetails = (review: MemoRappReview): JSX.Element => {
    return (
      <Paper id='reviewDetails' className="review-details" style={{ marginTop: '16px', boxShadow: 'none' }}>
        <Typography><strong>Date of Visit:</strong> {review.structuredReviewProperties.dateOfVisit}</Typography>
        <Typography><strong>Would Return:</strong> {review.structuredReviewProperties.wouldReturn ? 'Yes' : 'No'}</Typography>
        <Typography><strong>Review Text:</strong> {review.freeformReviewProperties.reviewText}</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleEditReview(review)}
        >
          Edit Review
        </Button>
      </Paper>
    );
  }

  const renderReviewDetailsForSelectedPlace = (): JSX.Element | null => {
    if (selectedPlace === null) {
      return null;
    }
    const reviewsForSelectedPlace: MemoRappReview[] = getFilteredReviewsForPlace(selectedPlace.place_id)
    const reviewDetails = reviewsForSelectedPlace.map((review: MemoRappReview) => {
      return renderReviewDetails(review);
    });
    return (
      <Paper style={{ boxShadow: 'none' }}>
        <Typography variant="h6">Reviews for {selectedPlace.name}</Typography>
        {reviewDetails}
      </Paper>
    )
  }

  const renderThumbsUps = (placeId: string) => {
    const yesCount = getWouldReturnToPlaceCounts(placeId).yesCount;
    if (yesCount > 0) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <span style={{ marginRight: '8px' }}>{yesCount}</span>
          <ThumbUpIcon />
        </div>
      );
    } else {
      return null;
    }
  }

  const renderThumbsDowns = (placeId: string) => {
    const noCount = getWouldReturnToPlaceCounts(placeId).noCount;
    if (noCount > 0) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <span style={{ marginRight: '8px' }}>{noCount}</span>
          <ThumbDownIcon />
        </div>
      );
    } else {
      return null;
    }
  }

  const renderDistanceAwayFilterPopover = (): JSX.Element => {
    return (
      <Popover
        open={Boolean(anchorElSetDistance)}
        anchorEl={anchorElSetDistance}
        onClose={handleDistanceClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <div style={{ padding: '20px', minWidth: '200px' }}>
          <Typography variant="subtitle1">Distance Away Filter</Typography>

          <FormControlLabel
            control={<Switch checked={distanceFilterEnabled} onChange={handleDistanceFilterToggle} />}
            label="Enable Distance Filter"
          />

          {/* From Label and Radio Buttons */}
          <Typography variant="body2" style={{ marginTop: '10px', marginBottom: '5px' }}>From</Typography>
          <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '10px' }}>
            <FormControlLabel
              control={
                <Radio
                  checked={fromLocation === 'current'}
                  onChange={() => setFromLocation('current')}
                  disabled={!distanceFilterEnabled} // Disable when the filter is off
                />
              }
              label="Current Location"
            />
            <FormControlLabel
              control={
                <Radio
                  checked={fromLocation === 'specified'}
                  onChange={() => setFromLocation('specified')}
                  disabled={!distanceFilterEnabled} // Disable when the filter is off
                />
              }
              label="Specify Location"
            />
          </div>

          {/* Google Maps Autocomplete Element */}
          {fromLocation === 'specified' && (
            <Autocomplete
              onLoad={(autocomplete) => (fromLocationAutocompleteRef.current = autocomplete)}
              onPlaceChanged={handleFromLocationPlaceChanged}
            >
              <input
                type="text"
                placeholder="Enter a from location"
                style={{
                  width: '100%',
                  padding: '10px',
                  boxSizing: 'border-box',
                  marginBottom: '10px',
                }}
                disabled={!distanceFilterEnabled} // Disable the input when filter is off
              />
            </Autocomplete>
          )}

          <Typography variant="body2" style={{ marginTop: '10px', marginBottom: '5px' }}>Distance</Typography>

          {/* Slider */}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2">0 mi</Typography>
            <Typography variant="body2">{fromLocationDistance} mi</Typography>
          </div>
          <Slider
            value={fromLocationDistance}
            onChange={handleDistanceSliderChange}
            aria-labelledby="distance-slider"
            min={0}
            max={10}
            step={0.5}
            disabled={!distanceFilterEnabled} // Disable slider when filter is off
            valueLabelDisplay="off"
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleDistanceClose}
            >
              Close
            </Button>
          </div>
        </div>
      </Popover>
    );
  }

  const renderWouldReturnFilterPopover = (): JSX.Element => {
    const disableClearButton = !wouldReturnFilter.yes && !wouldReturnFilter.no && !wouldReturnFilter.notSpecified;
    return (
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
              disabled={disableClearButton}
            >
              Clear
            </Button>
          </div>
          <Button
            variant="contained"
            color="primary"
            onClick={handleWouldReturnClose} // Ensure you have this function defined to handle the search
            style={{ alignSelf: 'flex-end', marginTop: '10px' }}
          >
            Close
          </Button>
        </div>
      </Popover>
    );
  }

  const renderElementIDontKnowHowToName = (): JSX.Element => {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div>
          <ToggleButtonGroup
            value={showAreaMap ? "map" : "details"}
            exclusive
            onChange={handleTogglePanel}
            style={{ marginBottom: '10px', display: 'flex', justifyContent: 'left' }}
          >
            <ToggleButton value="map" aria-label="Map">
              Map
            </ToggleButton>
            <ToggleButton value="details" aria-label="Review Details">
              Reviews
            </ToggleButton>
          </ToggleButtonGroup>
          {showAreaMap ?
            (
              <Autocomplete
                onLoad={(autocomplete) => (areaMapAutocompleteRef.current = autocomplete)}
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
            ) : null
          }
        </div>
        <div
          style={{ flex: 1 }}
        >
          {showAreaMap ? (
            <Paper id='mapContainer' className="map-container">
              {renderMap()}
            </Paper>
          ) : (
            <React.Fragment>
              {renderReviewDetailsForSelectedPlace()}
            </React.Fragment>
          )
          }
        </div>
      </div>
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
          <Button variant="contained" color="primary" onClick={handleNaturalLanguageQuery}>
            Search
          </Button>
        </div>

        {/* Filters */}
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Button variant="outlined" aria-describedby={anchorElSetDistance ? 'set-distance-popover' : undefined} onClick={handleDistanceClick}>
            Distance Away
          </Button>
          <Button variant="outlined" aria-describedby={anchorElWouldReturn ? 'would-return-popover' : undefined} onClick={handleWouldReturnClick}>
            Would Return
          </Button>
          <Button
            variant="outlined"
            onClick={handleSearchByFilter}
          >
            Search
          </Button>

          {renderDistanceAwayFilterPopover()}
          {renderWouldReturnFilterPopover()}

        </div>

        {/* Container for Places Table / Map */}
        <div className="table-and-details-container">
          <TableContainer component={Paper} className="scrollable-table-container">
            <Table stickyHeader>
              <TableHead>
                <TableRow className="table-head-fixed">
                  <TableCell align="center"></TableCell>
                  <TableCell align="center"></TableCell>
                  <TableCell align="center"></TableCell>
                  <TableCell align="center"></TableCell>
                  <TableCell>Place</TableCell>
                  <TableCell>Location</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPlaces.map((place: GooglePlace) => (
                  <React.Fragment key={place.place_id}>
                    <TableRow className="table-row-hover" onClick={() => handlePlaceClick(place)} >
                      <TableCell align="right" className="dimmed" style={smallColumnStyle}>
                        <IconButton onClick={() => handleShowMap(place.place_id)}>
                          <MapIcon />
                        </IconButton>
                      </TableCell>
                      <TableCell align="right" className="dimmed" style={smallColumnStyle}>
                        <IconButton onClick={() => handleShowDirections(place.place_id)}>
                          <DirectionsIcon />
                        </IconButton>
                      </TableCell>
                      <TableCell align="right" style={thumbsStyle}>
                        {renderThumbsUps(place.place_id)}
                      </TableCell>
                      <TableCell align="right" style={thumbsStyle}>
                        {renderThumbsDowns(place.place_id)}
                      </TableCell>
                      <TableCell>{place.name}</TableCell>
                      <TableCell>{getCityNameFromPlace(place) || 'Not provided'}</TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {renderElementIDontKnowHowToName()}
        </div>
      </div>
    </LoadScript>
  );
};

export default ReviewsPage;
