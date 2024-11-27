/**
 * Generates a strong but memorable password of specified length
 * Format: 6-7 letters, 2-3 numbers, 1 special character
 * @param length Length of the password to generate (minimum 10)
 * @returns A string containing the generated password
 */
export function generatePassword(length: number): string {
  // Ensure minimum length of 10
  length = Math.max(length, 10);

  const lowercase = "abcdefghijkmnpqrstuvwxyz"; // removed l and o to avoid confusion
  const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // removed I and O to avoid confusion
  const numbers = "23456789"; // removed 0 and 1 to avoid confusion
  const special = "@#$%&";

  // Generate 6-7 letters (alternating upper and lower case)
  let password = "";
  const letterCount = Math.floor(Math.random() * 2) + 6; // 6 or 7 letters

  for (let i = 0; i < letterCount; i++) {
    const charset = i % 2 === 0 ? lowercase : uppercase;
    password += charset[Math.floor(Math.random() * charset.length)];
  }

  // Add 2-3 numbers
  const numberCount = Math.floor(Math.random() * 2) + 2; // 2 or 3 numbers
  for (let i = 0; i < numberCount; i++) {
    password += numbers[Math.floor(Math.random() * numbers.length)];
  }

  // Add 1 special character
  password += special[Math.floor(Math.random() * special.length)];

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}
