"use strict";
/**
 * Helper functions for handling role permissions
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionManager = exports.chaPermissionList = void 0;
var auth_manager_1 = require("./auth-manager");
exports.chaPermissionList = [
    3, 7, 9, 11, 15, 22, 23, 30, 32, 41, 42, 43, 44, 45, 46, 47, 48, 50, 52, 53,
    55, 62, 63, 65, 67, 69, 70, 71, 78, 82, 83, 88, 90, 91, 92, 99, 102, 103, 104,
    105, 107, 108, 109, 110, 111, 112, 113, 114, 115, 118, 119, 120, 121, 122,
    123, 125, 126, 127, 128, 130, 131, 134, 135, 136, 138, 140, 141, 142, 144,
    145, 147, 148, 151, 162, 163, 164, 165, 166, 167, 169, 171, 178, 183, 185,
    186, 187, 188, 192, 194, 201, 202, 206, 207, 263, 266, 295, 296, 297, 350,
];
var PermissionManager = /** @class */ (function () {
    function PermissionManager(headers) {
        this.authManager = new auth_manager_1.AuthManager();
        this.headers = headers;
    }
    /**
     * Fetch permissions for a given role from Superset by roleId
     * @param roleID
     * @returns List of the role's permissions
     */
    PermissionManager.prototype.getPermissionsByRoleId = function (roleId) {
        return __awaiter(this, void 0, void 0, function () {
            var request;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        request = {
                            method: 'GET',
                            headers: this.headers,
                        };
                        return [4 /*yield*/, this.authManager.fetchRequest("/security/roles/".concat(roleId, "/permissions/"), request)];
                    case 1: return [2 /*return*/, (_a.sent())];
                }
            });
        });
    };
    /**
     * Replace the role's existing permissions with the new permission set
     * @param roleId Id of the role to be updated.
     * @param menuIds List of permission Ids to be appended to role
     * @returns list of updated permission ids
     */
    PermissionManager.prototype.updatePermissions = function (roleId, menuIds) {
        return __awaiter(this, void 0, void 0, function () {
            var request;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        request = {
                            method: 'POST',
                            headers: this.headers,
                            body: JSON.stringify(menuIds),
                        };
                        return [4 /*yield*/, this.authManager.fetchRequest("/security/roles/".concat(roleId, "/permissions"), request)];
                    case 1: return [2 /*return*/, (_a.sent())];
                }
            });
        });
    };
    return PermissionManager;
}());
exports.PermissionManager = PermissionManager;
