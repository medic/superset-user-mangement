"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRowLevelSecurity = void 0;
var generateRowLevelSecurity = function (roles, groupKey, placeCode, tables, userType) { return ({
    clause: "".concat(groupKey, "='").concat(placeCode, "'"),
    filter_type: "Regular",
    group_key: groupKey,
    name: "".concat(userType, "-").concat(placeCode),
    roles: roles,
    tables: JSON.parse(tables),
}); };
exports.generateRowLevelSecurity = generateRowLevelSecurity;
