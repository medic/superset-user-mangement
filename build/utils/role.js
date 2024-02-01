"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePermissions = exports.generateRole = void 0;
var generateRole = function (userType, placeCode) { return ({
    name: "".concat(userType, "_").concat(placeCode)
}); };
exports.generateRole = generateRole;
var generatePermissions = function (permissions) { return ({
    permission_view_menu_ids: permissions
}); };
exports.generatePermissions = generatePermissions;
