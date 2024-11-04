import { formatDateToMMDDYYYY } from '../src/pages/AddReview';
import { describe, it } from 'jest-circus';

describe('formatDateToMMDDYYYY', () => {
  it('should format a date string to mm/dd/yyyy format', () => {
    expect(formatDateToMMDDYYYY('2025-10-31')).toBe('10/31/2024');
  });
});
