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

export function extractCommentsFromItems(responseText: string, fieldName: string): { item: string; rating: string }[] {
  // Capture the whole field section for comments about each item
  const fieldRegex = new RegExp(`${fieldName}:\\s*([\\s\\S]*?)\\n`, 'i');
  const fieldMatch = responseText.match(fieldRegex);

  if (!fieldMatch || !fieldMatch[1]) return [];

  // Separate each item with comments, using commas outside parentheses as separators
  const itemsWithComments = fieldMatch[1].match(/[^,]+?\(.+?\)/g);

  if (!itemsWithComments) return [];

  // Extract item name and comment from each match
  return itemsWithComments.map((itemText: string) => {
    const itemMatch = itemText.match(/(.+?)\s*\((.+?)\)/);
    return {
      item: itemMatch ? itemMatch[1].trim() : itemText,
      rating: itemMatch ? itemMatch[2].trim() : '',
    };
  });
}


export function removeSquareBrackets(text: string): string {
  return text.replace(/^\[|\]$/g, '').trim();
}