import React from 'react';
import AddReview, { formatDateToMMDDYYYY, invokeBackendParsePreview } from '../src/pages/AddReview';
import { render, screen, fireEvent } from '@testing-library/react';

describe('formatDateToMMDDYYYY', () => {
  it('should format a date string to mm/dd/yyyy format', () => {
    console.log('test formatDateToMMDDYYYY');
    expect(formatDateToMMDDYYYY('2024-10-31')).toBe('10/31/2024');
  });
});


// describe('AddReview Component', () => {
//   it('renders Add Review title', () => {
//     render(<AddReview />);
//     expect(screen.getByText('Add a Review')).toBeInTheDocument();
//   });

//   it('shows error if trying to submit without a restaurant name', () => {
//     render(<AddReview />);
//     const submitButton = screen.getByText('Submit');
//     fireEvent.click(submitButton);
//     expect(screen.getByText(/enter the restaurant name/i)).toBeInTheDocument();
//   });
// });

describe('Preview', () => {
  it('invoke backend ParsePreview endpoint', () => {
    const previewBody: any = {
      structuredReviewProperties: {
        restaurantName: 'Doppio Zero Mountain View',
        userLocation: 'Mountain View',
        dateOfVisit: '2024-10-10'
      },
      reviewText: 'Great food, great service, great ambiance. I would definitely come back!',
      sessionId: 'mySessionId',
    };
    console.log('test invokeBackendParsePreview');
    console.log('previewBody:', previewBody);
    // expect(formatDateToMMDDYYYY('2024-10-31')).toBe('10/31/2024');
    expect(invokeBackendParsePreview(previewBody)).toBe('Great food, great service, great ambiance. I would definitely come back!');
  });
});