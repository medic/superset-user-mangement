/**
 * Generates a username from first and last name in the format firstName_lastName
 * Removes any numeric characters and special characters
 * @param firstName First name
 * @param lastName Last name
 * @returns Generated username in format firstname_lastname
 */
export function generateUsername(firstName: string, lastName: string): string {
  // Function to clean a name part
  const cleanNamePart = (name: string): string => {
    return name.toLowerCase()
      .normalize('NFD')  // Decompose accented characters
      .replace(/[\u0300-\u036f]/g, '')  // Remove diacritics
      .replace(/[^a-z\s]/g, '')  // Remove everything except letters and spaces
      .trim()  // Remove leading/trailing spaces
      .split(/\s+/)[0];  // Take only the first word
  };

  // Get first word of each name and clean them
  const firstPart = cleanNamePart(firstName);
  const lastPart = cleanNamePart(lastName);
  
  // Create username by combining first name and last name with underscore
  return `${firstPart}_${lastPart}`;
}
