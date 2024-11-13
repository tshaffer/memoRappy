import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Collapse, Typography, Button, Slider, Popover, FormControlLabel, Checkbox, TextField } from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';

interface Review {
  _id: string;
  dateOfVisit: string;
  wouldReturn: boolean | null;
}

interface Place {
  _id: string;
  name: string;
  reviews: Review[];
}

const mockPlaces: Place[] = [
  {
    _id: '1',
    name: 'Place 1',
    reviews: [
      { _id: 'r1', dateOfVisit: '2024-01-01', wouldReturn: true },
      { _id: 'r2', dateOfVisit: '2024-01-02', wouldReturn: null },
    ],
  },
  {
    _id: '2',
    name: 'Place 2',
    reviews: [
      { _id: 'r3', dateOfVisit: '2024-02-01', wouldReturn: false },
    ],
  },
];

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
    // Handle the search functionality for the freeform query here
    console.log("Searching for query:", query);
  };

  const openDistance = Boolean(anchorEl);
  const idDistance = openDistance ? 'distance-popover' : undefined;

  const openWouldReturn = Boolean(anchorElWouldReturn);
  const idWouldReturn = openWouldReturn ? 'would-return-popover' : undefined;

  return (
    <div style={{ padding: '20px' }}>
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
        
        {/* Would Return Filter Dropdown */}
        <div>
          <Button variant="outlined" aria-describedby={idWouldReturn} onClick={handleWouldReturnClick}>
            Would Return
          </Button>
          <Popover
            id={idWouldReturn}
            open={openWouldReturn}
            anchorEl={anchorElWouldReturn}
            onClose={handleWouldReturnClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
          >
            <div style={{ padding: '20px' }}>
              <Typography variant="subtitle1">Would Return</Typography>
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
              <Button variant="outlined" size="small" onClick={handleClearWouldReturnFilter} style={{ marginTop: '10px' }}>
                Clear
              </Button>
            </div>
          </Popover>
        </div>
        
        {/* Distance Filter */}
        <div>
          <Button variant="outlined" aria-describedby={idDistance} onClick={handleDistanceClick}>
            Distance: {distance} miles
          </Button>
          <Popover
            id={idDistance}
            open={openDistance}
            anchorEl={anchorEl}
            onClose={handleDistanceClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
          >
            <div style={{ padding: '20px' }}>
              <Typography variant="subtitle1">Select Distance</Typography>
              <Slider
                value={distance}
                onChange={handleDistanceSliderChange}
                aria-labelledby="distance-slider"
                min={1}
                max={100}
                valueLabelDisplay="auto"
              />
            </div>
          </Popover>
        </div>
      </div>

      {/* Table to display places with expandable rows for reviews */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Place</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mockPlaces.map((place) => (
              <React.Fragment key={place._id}>
                <TableRow>
                  <TableCell>{place.name}</TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => handleExpandClick(place._id)}>
                      {expandedPlaceId === place._id ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={2} style={{ padding: 0 }}>
                    <Collapse in={expandedPlaceId === place._id} timeout="auto" unmountOnExit>
                      <Table size="small">
                        <TableBody>
                          {place.reviews.map((review) => (
                            <TableRow key={review._id}>
                              <TableCell>Date: {review.dateOfVisit}</TableCell>
                              <TableCell>Would Return: {review.wouldReturn === null ? 'Not Specified' : review.wouldReturn ? 'Yes' : 'No'}</TableCell>
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
