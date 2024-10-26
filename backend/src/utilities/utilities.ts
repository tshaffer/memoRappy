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

export function removeSquareBrackets(text: string): string {
  return text.replace(/^\[|\]$/g, '').trim();
}