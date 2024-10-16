"use strict";
/**
 * Class to fetch and manage roles from Superset
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleManager = void 0;
var rison_1 = __importDefault(require("rison"));
var permission_manager_1 = require("./permission-manager");
var auth_manager_1 = require("./auth-manager");
var RoleManager = /** @class */ (function () {
    function RoleManager() {
        this.authManager = new auth_manager_1.AuthManager();
        this.headers = null;
    }
    RoleManager.prototype.initHeaders = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!!this.headers) return [3 /*break*/, 2];
                        _a = this;
                        return [4 /*yield*/, this.authManager.getHeaders()];
                    case 1:
                        _a.headers = _b.sent();
                        _b.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Fetches Superset Roles by page
     */
    RoleManager.prototype.fetchSupersetRoles = function () {
        return __awaiter(this, void 0, void 0, function () {
            var currentPage, roles, request, queryParams, roleList;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.initHeaders()];
                    case 1:
                        _a.sent();
                        currentPage = 0;
                        roles = [];
                        request = {
                            method: 'GET',
                            headers: this.headers,
                        };
                        _a.label = 2;
                    case 2:
                        if (!true) return [3 /*break*/, 4];
                        queryParams = rison_1.default.encode({ page: currentPage, page_size: 100 });
                        return [4 /*yield*/, this.authManager.fetchRequest("/security/roles?q=".concat(queryParams), request)];
                    case 3:
                        roleList = (_a.sent());
                        // Append roles from the current page to the allRoles array
                        roles = roles.concat(roleList.result);
                        // If there are no more roles on the current page, break out of the loop
                        if (roleList.result.length === 0) {
                            console.log("Reached page ".concat(currentPage, ". No more roles to fetch."));
                            return [3 /*break*/, 4];
                        }
                        // Increment the page value for the next request
                        currentPage++;
                        return [3 /*break*/, 2];
                    case 4: return [2 /*return*/, roles];
                }
            });
        });
    };
    /**
     * Update role permissions on Superset in batches of 150
     */
    RoleManager.prototype.updateRolePermissions = function (roles) {
        return __awaiter(this, void 0, void 0, function () {
            var headers, permissionManager, updatedRoles, ids, batchSize, i, batch, _i, batch_1, role;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.initHeaders()];
                    case 1:
                        headers = _a.sent();
                        permissionManager = new permission_manager_1.PermissionManager(headers);
                        updatedRoles = [];
                        ids = {
                            permission_view_menu_ids: permission_manager_1.chaPermissionList,
                        };
                        batchSize = 150;
                        i = 0;
                        _a.label = 2;
                    case 2:
                        if (!(i < roles.length)) return [3 /*break*/, 7];
                        batch = roles.slice(i, i + batchSize);
                        _i = 0, batch_1 = batch;
                        _a.label = 3;
                    case 3:
                        if (!(_i < batch_1.length)) return [3 /*break*/, 6];
                        role = batch_1[_i];
                        return [4 /*yield*/, permissionManager.updatePermissions(role.id, ids)];
                    case 4:
                        _a.sent();
                        updatedRoles.push(role.id);
                        _a.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 3];
                    case 6:
                        i += batchSize;
                        return [3 /*break*/, 2];
                    case 7: return [2 /*return*/, updatedRoles];
                }
            });
        });
    };
    return RoleManager;
}());
exports.RoleManager = RoleManager;
