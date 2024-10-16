"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRLS = exports.generateRowLevelSecurity = void 0;
var generateRowLevelSecurity = function (roles, groupKey, placeCode, tables) { return ({
    clause: "".concat(groupKey, "='").concat(placeCode, "'"),
    filter_type: "Regular",
    group_key: groupKey,
    name: "cha-".concat(placeCode),
    roles: roles,
    tables: JSON.parse(tables)
}); };
exports.generateRowLevelSecurity = generateRowLevelSecurity;
var generateRLS = function (roles, groupKey, placeCode, tables) {
    if (!Array.isArray(roles) || !Array.isArray(tables)) {
        throw new Error('Roles and tables must be arrays');
    }
    return {
        clause: "".concat(groupKey, "='").concat(placeCode, "'"),
        filter_type: "Regular",
        group_key: groupKey,
        name: "cha-".concat(placeCode),
        roles: roles,
        tables: tables
    };
};
exports.generateRLS = generateRLS;
