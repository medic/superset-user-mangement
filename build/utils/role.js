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
exports.updateRolePermissions = exports.getCHARoles = exports.getCHUCodes = exports.fetchAllRoles = void 0;
var superset_1 = require("./superset");
var redis_1 = require("redis");
var rison_1 = __importDefault(require("rison"));
var fs_1 = __importDefault(require("fs"));
var csv_parser_1 = __importDefault(require("csv-parser"));
var permissions_1 = require("./permissions");
// export const getRoles = async (headers: any): Promise<SupersetRole[]> => {
//   const request = initRequest('GET', headers);
//
//   const queryParams = rison.encode({"page": 0, "page_size": 100});
//   const roleList: RoleList = await fetchRequest(`/security/roles?q=${queryParams}`, request) as RoleList;
//
//   const formattedRoles = formatRoles(roleList.result);
//   writeToCSV(formattedRoles, "output.csv");
//
//   await readFromFile("output.csv");
//
//   return roleList.result;
// }
function fetchAllRoles(headers) {
    return __awaiter(this, void 0, void 0, function () {
        var currentPage, roles, request, queryParams, roleList;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    currentPage = 0;
                    roles = [];
                    request = (0, superset_1.initRequest)('GET', headers);
                    _a.label = 1;
                case 1:
                    if (!true) return [3 /*break*/, 3];
                    queryParams = rison_1.default.encode({ page: currentPage, page_size: 100 });
                    return [4 /*yield*/, (0, superset_1.fetchRequest)("/security/roles?q=".concat(queryParams), request)];
                case 2:
                    roleList = (_a.sent());
                    // Append roles from the current page to the allRoles array
                    roles = roles.concat(roleList.result);
                    // If there are no more roles on the current page, break out of the loop
                    if (roleList.result.length === 0) {
                        console.log("Reached page ".concat(currentPage, ". No more roles to fetch."));
                        return [3 /*break*/, 3];
                    }
                    // Increment the page value for the next request
                    currentPage++;
                    return [3 /*break*/, 1];
                case 3: return [4 /*yield*/, persistFetchedRoles(roles)];
                case 4:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.fetchAllRoles = fetchAllRoles;
function persistFetchedRoles(roles) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, formatRoles(roles)
                        .then(function (results) {
                        writeToCSV(results, 'output.csv');
                        return results;
                    })
                        .then(function (results) {
                        saveRoles(results);
                    })
                        .catch(function (error) {
                        console.log(error);
                    })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function formatRoles(supersetRoles) {
    return __awaiter(this, void 0, void 0, function () {
        var parsedRoles, _i, supersetRoles_1, role, key;
        return __generator(this, function (_a) {
            parsedRoles = [];
            for (_i = 0, supersetRoles_1 = supersetRoles; _i < supersetRoles_1.length; _i++) {
                role = supersetRoles_1[_i];
                key = extractCHUCode(role.name);
                if (key) {
                    console.log(key);
                    parsedRoles.push({ code: key, role: role });
                }
            }
            return [2 /*return*/, parsedRoles];
        });
    });
}
function saveRoles(roles) {
    return __awaiter(this, void 0, void 0, function () {
        var redisClient, isConnected, _i, roles_1, role, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    redisClient = getRedisClient();
                    isConnected = false;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 7, 8, 9]);
                    return [4 /*yield*/, redisClient.connect()];
                case 2:
                    _a.sent();
                    redisClient.flushAll();
                    isConnected = true;
                    _i = 0, roles_1 = roles;
                    _a.label = 3;
                case 3:
                    if (!(_i < roles_1.length)) return [3 /*break*/, 6];
                    role = roles_1[_i];
                    return [4 /*yield*/, redisClient.hSet(role.code, 'role', JSON.stringify(role.role))];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6:
                    console.log("".concat(roles.length, " Roles saved to Redis successfully."));
                    return [3 /*break*/, 9];
                case 7:
                    error_1 = _a.sent();
                    console.error('Error saving roles to Redis:', error_1);
                    throw error_1;
                case 8:
                    if (isConnected) {
                        disconnectRedis(redisClient);
                    }
                    return [7 /*endfinally*/];
                case 9: return [2 /*return*/];
            }
        });
    });
}
function disconnectRedis(redisClient) {
    return __awaiter(this, void 0, void 0, function () {
        var disconnectError_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, redisClient.disconnect()];
                case 1:
                    _a.sent();
                    console.log('Redis client disconnected successfully.');
                    return [3 /*break*/, 3];
                case 2:
                    disconnectError_1 = _a.sent();
                    console.error('Error disconnecting Redis client:', disconnectError_1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function extractCHUCode(roleName) {
    var chuCode = RegExp(/\d{6}/).exec(roleName); //match any 6 consecutive digits
    return chuCode ? chuCode[0] : null;
}
function getCHUCodes(place) {
    var chuCodes = [];
    if (place.includes(',')) {
        var places = place.split(',');
        places.forEach(function (place) {
            place = place.trim();
            chuCodes.push(place);
        });
    }
    return chuCodes;
}
exports.getCHUCodes = getCHUCodes;
function getCHARoles(array, place) {
    var roles = [];
    console.log(place);
    if (place.includes(',')) {
        var places = place.split(',');
        places.forEach(function (place) {
            place = place.trim();
            roles.push.apply(roles, filterCHARoles(array, place));
        });
    }
    else {
        roles = filterCHARoles(array, place);
    }
    return roles;
}
exports.getCHARoles = getCHARoles;
function filterCHARoles(roles, searchString) {
    var escapedSearchString = escapeRegExp(searchString);
    var regexPattern = new RegExp("^".concat(escapedSearchString, "_"), 'i');
    return roles.filter(function (supersetRole) { return regexPattern.test(supersetRole.name); });
}
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
/**
 * This function should be run the first time the app is being set up to pull all the roles from superset.
 * Since we have to make successive calls of 100 roles each, this ensures we have a file with all the roles that can
 * be reused by anyone managing superset users.
 * @param parsedRole Role with a mapping of the 6 digit chu code and the JSON of the role for easier retrieval from Redis
 * @param filePath file that will contain the parsed roles.
 */
function writeToCSV(parsedRole, filePath) {
    return __awaiter(this, void 0, void 0, function () {
        var fileExists, header, stream;
        return __generator(this, function (_a) {
            console.log(parsedRole);
            fileExists = fs_1.default.existsSync(filePath);
            header = 'code,role\n';
            stream = fs_1.default.createWriteStream(filePath, {
                flags: fileExists ? 'a' : 'w',
            });
            // If the file is empty or does not exist, write the header
            if (!fileExists || fs_1.default.statSync(filePath).size === 0) {
                stream.write(header);
            }
            parsedRole.forEach(function (pRole) {
                var code = pRole.code, role = pRole.role;
                stream.write("".concat(code, ",").concat(JSON.stringify(role), "\n"));
            });
            stream.end();
            return [2 /*return*/];
        });
    });
}
/**
 * Read from CSV containing Superset roles. This file will be loaded to Redis for easier access.
 * @param filePath
 */
function readFromFile(filePath) {
    return __awaiter(this, void 0, void 0, function () {
        var parsedRoles;
        return __generator(this, function (_a) {
            parsedRoles = [];
            fs_1.default.createReadStream(filePath)
                .on('error', function () {
                throw new Error('File not found');
            })
                .pipe((0, csv_parser_1.default)())
                .on('data', function (data) {
                parsedRoles.push(data);
            })
                .on('error', function (error) {
                console.log(error.message);
            })
                .on('end', function () {
                console.log(parsedRoles);
                console.log("Processed ".concat(parsedRoles.length, " successfully"));
            });
            return [2 /*return*/];
        });
    });
}
function updateRolePermissions(headers) {
    return __awaiter(this, void 0, void 0, function () {
        var redisClient, updatedRoles, menuIds, isConnected, keys, BATCH_SIZE, i, batchKeys, batchRoles, _i, batchRoles_1, parsedRole, error_2;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    redisClient = getRedisClient();
                    updatedRoles = [];
                    menuIds = {
                        permission_view_menu_ids: permissions_1.chaPermissionList
                    };
                    isConnected = false;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 11, 12, 15]);
                    return [4 /*yield*/, redisClient.connect()];
                case 2:
                    _a.sent();
                    isConnected = true;
                    return [4 /*yield*/, redisClient.keys('*')];
                case 3:
                    keys = _a.sent();
                    BATCH_SIZE = 150;
                    i = 0;
                    _a.label = 4;
                case 4:
                    if (!(i < keys.length)) return [3 /*break*/, 10];
                    batchKeys = keys.slice(i, i + BATCH_SIZE);
                    return [4 /*yield*/, Promise.all(batchKeys.map(function (key) { return __awaiter(_this, void 0, void 0, function () {
                            var role;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, redisClient.hGet(key, 'role')];
                                    case 1:
                                        role = _a.sent();
                                        console.log(role);
                                        return [2 /*return*/, parseRoleString(role)];
                                }
                            });
                        }); }))];
                case 5:
                    batchRoles = _a.sent();
                    _i = 0, batchRoles_1 = batchRoles;
                    _a.label = 6;
                case 6:
                    if (!(_i < batchRoles_1.length)) return [3 /*break*/, 9];
                    parsedRole = batchRoles_1[_i];
                    if (!parsedRole) return [3 /*break*/, 8];
                    return [4 /*yield*/, (0, permissions_1.updatePermissions)(parsedRole.id, headers, menuIds)];
                case 7:
                    _a.sent();
                    updatedRoles.push(parsedRole.id);
                    _a.label = 8;
                case 8:
                    _i++;
                    return [3 /*break*/, 6];
                case 9:
                    i += BATCH_SIZE;
                    return [3 /*break*/, 4];
                case 10: return [3 /*break*/, 15];
                case 11:
                    error_2 = _a.sent();
                    console.error('Error connecting to Redis:', error_2);
                    return [3 /*break*/, 15];
                case 12:
                    if (!isConnected) return [3 /*break*/, 14];
                    return [4 /*yield*/, disconnectRedis(redisClient)];
                case 13:
                    _a.sent();
                    _a.label = 14;
                case 14: return [7 /*endfinally*/];
                case 15: return [2 /*return*/, updatedRoles];
            }
        });
    });
}
exports.updateRolePermissions = updateRolePermissions;
function getRedisClient() {
    var redisClient = (0, redis_1.createClient)();
    redisClient.on('error', function (err) { return console.log('Redis Client Error', err); });
    return redisClient;
}
function parseRoleString(roleString) {
    if (roleString) {
        // Type guard to ensure roleString is not undefined
        try {
            var role = JSON.parse(roleString);
            return role;
        }
        catch (error) {
            console.error('Error parsing JSON string:', error);
            return undefined;
        }
    }
    else {
        console.error('jsonString is undefined');
        return undefined;
    }
}
