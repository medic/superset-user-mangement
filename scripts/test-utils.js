"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var password_utils_1 = require("../src/utils/password.utils");
var string_utils_1 = require("../src/utils/string.utils");
// Test password generation
console.log("Generated passwords:");
for (var i = 0; i < 3; i++) {
    console.log("Password ".concat(i + 1, ": ").concat((0, password_utils_1.generatePassword)(10)));
}
// Test username generation
var testCases = [
    { first: "John", last: "Doe" },
    { first: "Mary Jane", last: "Smith" },
    { first: "Robert123", last: "Brown456" }
];
console.log("\nGenerated usernames:");
testCases.forEach(function (_a, index) {
    var first = _a.first, last = _a.last;
    console.log("".concat(first, " ").concat(last, " -> ").concat((0, string_utils_1.generateUsername)(first, last)));
});
