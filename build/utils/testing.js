"use strict";
var fetch = require('node-fetch');
var generateRole = function (userType, placeCode) {
    return {
        name: "".concat(userType, "_").concat(placeCode)
    };
};
// test();
console.log(generateRole('cha', '708688'));
