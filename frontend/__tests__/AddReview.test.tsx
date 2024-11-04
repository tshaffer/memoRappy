import React from 'react';
import AddReview, { formatDateToMMDDYYYY } from '../src/pages/AddReview';
import { render, screen, fireEvent } from '@testing-library/react';

describe('formatDateToMMDDYYYY', () => {
  it('should format a date string to mm/dd/yyyy format', () => {
    expect(formatDateToMMDDYYYY('2024-10-31')).toBe('10/31/2024');
  });
});


describe('AddReview Component', () => {
  it('renders Add Review title', () => {
    render(<AddReview />);
    expect(screen.getByText('Add a Review')).toBeInTheDocument();
  });

  it('shows error if trying to submit without a restaurant name', () => {
    render(<AddReview />);
    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);
    expect(screen.getByText(/enter the restaurant name/i)).toBeInTheDocument();
  });
});