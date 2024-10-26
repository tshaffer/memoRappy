// Extract a field from the response based on a keyword
export const extractFieldFromResponse = (response: string, fieldName: string): string => {
  const regex = new RegExp(`${fieldName}:\\s*(.*)`, 'i');
  const match = response.match(regex);
  return match ? match[1].trim() : '';
};

// Extract a list of items from the response based on a keyword
export const extractListFromResponse = (response: string, fieldName: string): string[] => {
  const regex = new RegExp(`${fieldName}:\\s*(.*)`, 'i');
  const match = response.match(regex);
  return match ? match[1].split(',').map(item => item.trim()) : [];
};

// Helper function to clean the date string and add the current year if missing
// TEDTODO - may no longer be needed given the changes to the OpenAI prompt 
export const cleanDateString = (dateStr: string): string => {

  console.log('cleanDateString:');
  console.log(dateStr);

  const currentYear = new Date().getFullYear();

  // Remove ordinal suffixes like "st", "nd", "rd", "th"
  let cleanedDate = dateStr.replace(/(\d+)(st|nd|rd|th)/, '$1').trim();

  // Check if the year is missing by seeing if the string contains a 4-digit number (year)
  const yearRegex = /\b\d{4}\b/;
  if (!yearRegex.test(cleanedDate)) {
    // Append the current year if it's missing
    cleanedDate += ` ${currentYear}`;
  }

  console.log(cleanedDate);

  return cleanedDate;
};

