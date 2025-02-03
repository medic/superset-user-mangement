/**
 * Generates a username from first and last name in the format firstWord_lastWord
 * Removes any numeric characters and special characters
 * @param firstName First name
 * @param lastName Last name
 * @returns Generated username in format firstword_lastword of the full name
 */
export function generateUsername(firstName: string, lastName: string): string {
  // Function to clean text and split into words
  const cleanText = (text: string): string[] => {
    return text.toLowerCase()
      .normalize('NFD')  // Decompose accented characters
      .replace(/[\u0300-\u036f]/g, '')  // Remove diacritics
      .replace(/[^a-z\s]/g, '')  // Remove everything except letters and spaces
      .trim()  // Remove leading/trailing spaces
      .split(/\s+/);  // Split into words
  };

  // Combine and clean both names
  const allWords = [...cleanText(firstName), ...cleanText(lastName)];

  // Get first and last words
  const firstWord = allWords[0];
  const lastWord = allWords[allWords.length - 1];

  // Create username by combining first and last words with underscore
  return `${firstWord}_${lastWord}`;
}
