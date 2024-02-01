"use strict";
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
var fs_1 = __importDefault(require("fs"));
var csv_parser_1 = __importDefault(require("csv-parser"));
var config_1 = require("./config/config");
var auth_1 = require("./utils/auth");
var role_1 = require("./utils/role");
var rowlevelsecurity_1 = require("./utils/rowlevelsecurity");
var user_1 = require("./utils/user");
var superset_1 = require("./utils/superset");
var url_1 = require("./utils/url");
var DASHBOARD_VIEWER_ROLE_ID = 7;
var API_URL = (0, url_1.resolveUrl)(config_1.SUPERSET.baseURL, config_1.SUPERSET.apiPath);
var readAndParse = function (fileName) { return __awaiter(void 0, void 0, void 0, function () {
    var BEARER_TOKEN, _a, CSRF_TOKEN, COOKIE, AUTHORIZATION_HEADERS, dashboardViewerPermissions, PERMISSIONS, results, rolesAvailableOnSuperset, rowLevelFromSuperset;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, (0, auth_1.getBearerToken)(API_URL, {
                    username: config_1.SUPERSET.username,
                    password: config_1.SUPERSET.password,
                    provider: 'db',
                })];
            case 1:
                BEARER_TOKEN = _b.sent();
                return [4 /*yield*/, (0, auth_1.getCSRFTokenAndCookie)(API_URL, BEARER_TOKEN)];
            case 2:
                _a = _b.sent(), CSRF_TOKEN = _a[0], COOKIE = _a[1];
                AUTHORIZATION_HEADERS = (0, auth_1.getFormattedHeaders)(BEARER_TOKEN, CSRF_TOKEN, COOKIE);
                return [4 /*yield*/, (0, superset_1.getPermissionsByRoleID)(API_URL, AUTHORIZATION_HEADERS, DASHBOARD_VIEWER_ROLE_ID)];
            case 3:
                dashboardViewerPermissions = _b.sent();
                PERMISSIONS = dashboardViewerPermissions.result.map(function (item) { return item.id; });
                results = [];
                return [4 /*yield*/, (0, superset_1.getRoles)(API_URL, AUTHORIZATION_HEADERS)];
            case 4:
                rolesAvailableOnSuperset = (_b.sent()).result;
                return [4 /*yield*/, (0, superset_1.getRequests)(API_URL, AUTHORIZATION_HEADERS, "/rowlevelsecurity/")];
            case 5:
                rowLevelFromSuperset = (_b.sent()).result;
                fs_1.default.createReadStream(fileName, 'utf-8')
                    .on('error', function () {
                    // handle error
                })
                    .pipe((0, csv_parser_1.default)())
                    .on('data', function (data) { return results.push(data); })
                    .on('end', function () { return __awaiter(void 0, void 0, void 0, function () {
                    var _loop_1, _i, results_1, user;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                _loop_1 = function (user) {
                                    var roleResult, role, rolePermissions, roleExists, createdRole, rowLevelSecurity, generatedUser, doesRowLevelExist, response;
                                    return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0:
                                                roleResult = void 0;
                                                role = (0, role_1.generateRole)(user.role, user.place);
                                                rolePermissions = (0, role_1.generatePermissions)(PERMISSIONS);
                                                roleExists = rolesAvailableOnSuperset.find(function (ssrole) { return ssrole.name === role.name; });
                                                if (!(roleExists !== undefined)) return [3 /*break*/, 1];
                                                roleResult = roleExists;
                                                return [3 /*break*/, 3];
                                            case 1: return [4 /*yield*/, (0, superset_1.postRequest)(API_URL, AUTHORIZATION_HEADERS, "/security/roles/", (0, superset_1.stringifyRequest)(role))];
                                            case 2:
                                                roleResult = _b.sent();
                                                rolesAvailableOnSuperset.push({
                                                    id: roleResult.id,
                                                    name: roleResult.result.name,
                                                });
                                                _b.label = 3;
                                            case 3:
                                                createdRole = roleResult;
                                                rowLevelSecurity = (0, rowlevelsecurity_1.generateRowLevelSecurity)([createdRole.id], user.group, user.place, config_1.CHA_TABLES, user.role);
                                                return [4 /*yield*/, (0, superset_1.postRequest)(API_URL, AUTHORIZATION_HEADERS, "/security/roles/".concat(createdRole.id, "/permissions"), (0, superset_1.stringifyRequest)(rolePermissions))];
                                            case 4:
                                                _b.sent();
                                                generatedUser = (0, user_1.generateUser)(user, [createdRole.id]);
                                                return [4 /*yield*/, (0, superset_1.postRequest)(API_URL, AUTHORIZATION_HEADERS, "/security/users/", (0, superset_1.stringifyRequest)(generatedUser))];
                                            case 5:
                                                _b.sent();
                                                doesRowLevelExist = rowLevelFromSuperset.some(function (level) { return level.name === rowLevelSecurity.name; });
                                                if (!!doesRowLevelExist) return [3 /*break*/, 7];
                                                return [4 /*yield*/, (0, superset_1.postRequest)(API_URL, AUTHORIZATION_HEADERS, "/rowlevelsecurity/", (0, superset_1.stringifyRequest)(rowLevelSecurity))];
                                            case 6:
                                                response = _b.sent();
                                                rowLevelFromSuperset.push(response.result);
                                                _b.label = 7;
                                            case 7: return [2 /*return*/];
                                        }
                                    });
                                };
                                _i = 0, results_1 = results;
                                _a.label = 1;
                            case 1:
                                if (!(_i < results_1.length)) return [3 /*break*/, 4];
                                user = results_1[_i];
                                return [5 /*yield**/, _loop_1(user)];
                            case 2:
                                _a.sent();
                                _a.label = 3;
                            case 3:
                                _i++;
                                return [3 /*break*/, 1];
                            case 4: return [2 /*return*/];
                        }
                    });
                }); });
                return [2 /*return*/];
        }
    });
}); };
readAndParse(config_1.DATA_FILE_PATH);
