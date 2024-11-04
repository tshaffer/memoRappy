import { formatDateToMMDDYYYY } from '../src/pages/AddReview';

describe('formatDateToMMDDYYYY', () => {
  it('should format a date string to mm/dd/yyyy format', () => {
    expect(formatDateToMMDDYYYY('2024-10-31')).toBe('10/31/2024');
  });
});

