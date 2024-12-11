"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUsername = void 0;
/**
 * Generates a username from first and last name
 * Removes any numeric characters and special characters
 * @param firstName First name
 * @param lastName Last name
 * @returns Generated username
 */
function generateUsername(firstName, lastName) {
    // Remove any numeric characters and special characters
    var cleanFirstName = firstName.toLowerCase().replace(/[^a-z]/g, '');
    var cleanLastName = lastName.toLowerCase().replace(/[^a-z]/g, '');
    // Create username by combining first name and first letter of last name
    return "".concat(cleanFirstName).concat(cleanLastName.charAt(0));
}
exports.generateUsername = generateUsername;
