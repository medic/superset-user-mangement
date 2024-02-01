"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUser = void 0;
var generateUser = function (rawObj, rolesArray) {
    var active = rawObj.active, first_name = rawObj.first_name, last_name = rawObj.last_name, email = rawObj.email, username = rawObj.username, password = rawObj.password;
    return {
        active: active,
        first_name: first_name,
        last_name: last_name,
        email: email,
        username: username,
        password: password,
        roles: rolesArray
    };
};
exports.generateUser = generateUser;
