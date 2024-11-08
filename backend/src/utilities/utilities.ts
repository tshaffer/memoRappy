import { ItemReview } from "../types";

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

export function extractItemReviews(responseText: string,): ItemReview[] {
  // Update the regex to match the "Item reviews" format with JSON-like array
  // const fieldRegex = new RegExp(`${fieldName}:\\s*\\[([\\s\\S]*?)]`, 'i'); // Adjusted to match array format in "Item reviews"
  const fieldName = "Item reviews";
  const fieldRegex = new RegExp(`${fieldName}:\\s*\\[([\\s\\S]*?)]`, 'i'); // Adjusted to match array format in "Item reviews"
  const fieldMatch = responseText.match(fieldRegex);

  if (!fieldMatch || !fieldMatch[1]) return [];

  try {
    // Parse as JSON by adding brackets to form a valid JSON array
    const itemReviews = JSON.parse(fieldMatch[0].replace(`${fieldName}: `, ""));
    return itemReviews.map((item: any) => ({
      item: item.item || "",
      review: item.review || "",
    }));
  } catch (error) {
    console.error("Error parsing item reviews:", error);
    return [];
  }
}

export function removeSquareBrackets(text: string): string {
  return text.replace(/^\[|\]$/g, '').trim();
}