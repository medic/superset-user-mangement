import { generatePassword } from "../src/utils/password.utils";
import { generateUsername } from "../src/utils/string.utils";

// Test password generation
console.log("Generated passwords (more alphabetic, less special characters):");
for (let i = 0; i < 5; i++) {
    console.log(`Password ${i + 1}: ${generatePassword(10)}`);
}

// Test username generation
const testCases = [
    { first: "John", last: "Doe" },
    { first: "Mary Jane", last: "Smith" },
    { first: "Robert123", last: "Brown456" },
    { first: "José", last: "García" },
    { first: "Sarah-Jane", last: "O'Connor" },
    { first: "Mary Jane", last: "van der Waal" }
];

console.log("\nGenerated usernames (firstName_lastName format):");
testCases.forEach(({ first, last }) => {
    const username = generateUsername(first, last);
    console.log(`${first} ${last} -> ${username}`);
});
