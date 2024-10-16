"use strict";
/**
 * Helper class to save convert, save and retrieve roles from Redis.
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
exports.RoleStore = void 0;
var redis_1 = require("redis");
var fs_1 = __importDefault(require("fs"));
var csv_parser_1 = __importDefault(require("csv-parser"));
var RoleStore = /** @class */ (function () {
    function RoleStore() {
        this.isConnected = false;
        this.redisClient = (0, redis_1.createClient)();
        this.redisClient.on('error', function (err) {
            return console.log('Redis Client Error', err);
        });
    }
    RoleStore.prototype.connectRedis = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!this.isConnected) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.redisClient.connect()];
                    case 1:
                        _a.sent();
                        this.isConnected = true;
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    RoleStore.prototype.closeRedis = function () {
        return __awaiter(this, void 0, void 0, function () {
            var disconnectError_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.isConnected) return [3 /*break*/, 4];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.redisClient.disconnect()];
                    case 2:
                        _a.sent();
                        this.isConnected = false;
                        console.log('Redis client disconnected successfully.');
                        return [3 /*break*/, 4];
                    case 3:
                        disconnectError_1 = _a.sent();
                        console.error('Error disconnecting Redis client:', disconnectError_1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Persist roles in Redis with the CHU code as the key
     * @param roles Formatted version of Superset Role
     */
    RoleStore.prototype.saveRoles = function (roles) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, roles_1, role, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.connectRedis()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 7, 8, 10]);
                        _i = 0, roles_1 = roles;
                        _a.label = 3;
                    case 3:
                        if (!(_i < roles_1.length)) return [3 /*break*/, 6];
                        role = roles_1[_i];
                        return [4 /*yield*/, this.redisClient.hSet(role.code, 'role', JSON.stringify(role.role))];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 3];
                    case 6:
                        console.log("".concat(roles.length, " Roles saved to Redis successfully."));
                        return [3 /*break*/, 10];
                    case 7:
                        error_1 = _a.sent();
                        console.error('Error saving roles to Redis:', error_1);
                        throw error_1;
                    case 8: return [4 /*yield*/, this.closeRedis()];
                    case 9:
                        _a.sent();
                        return [7 /*endfinally*/];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Fetch roles from Redis
     */
    RoleStore.prototype.fetchRoles = function () {
        return __awaiter(this, void 0, void 0, function () {
            var roles, keys, _i, keys_1, key, role, supersetRole, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.connectRedis()];
                    case 1:
                        _a.sent();
                        roles = [];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 8, 9, 11]);
                        return [4 /*yield*/, this.redisClient.keys('*')];
                    case 3:
                        keys = _a.sent();
                        _i = 0, keys_1 = keys;
                        _a.label = 4;
                    case 4:
                        if (!(_i < keys_1.length)) return [3 /*break*/, 7];
                        key = keys_1[_i];
                        return [4 /*yield*/, this.redisClient.hGet(key, 'role')];
                    case 5:
                        role = _a.sent();
                        supersetRole = this.parseRoleString(role);
                        if (supersetRole) {
                            roles.push({ code: key, role: supersetRole });
                        }
                        _a.label = 6;
                    case 6:
                        _i++;
                        return [3 /*break*/, 4];
                    case 7: return [3 /*break*/, 11];
                    case 8:
                        error_2 = _a.sent();
                        console.error('Error reading from Redis:', error_2);
                        throw error_2;
                    case 9: return [4 /*yield*/, this.closeRedis()];
                    case 10:
                        _a.sent();
                        return [7 /*endfinally*/];
                    case 11: return [2 /*return*/, roles];
                }
            });
        });
    };
    /**
     * Converter for persisted role (string) to @property SupersetRole
     * @param roleString
     * @returns @property SupersetRole
     */
    RoleStore.prototype.parseRoleString = function (roleString) {
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
    };
    /**
     * Optional function to write roles to CSV instead of persisting to Redis.
     * @param roles Stringified version of Superset Role
     * @param filePath URI to the CSV file to write to
     */
    RoleStore.prototype.writeRolesToCSV = function (roles, filePath) {
        return __awaiter(this, void 0, void 0, function () {
            var fileExists, header, stream;
            return __generator(this, function (_a) {
                fileExists = fs_1.default.existsSync(filePath);
                header = 'code,role\n';
                stream = fs_1.default.createWriteStream(filePath, {
                    flags: fileExists ? 'a' : 'w',
                });
                // If the file is empty or does not exist, write the header
                if (!fileExists || fs_1.default.statSync(filePath).size === 0) {
                    stream.write(header);
                }
                roles.forEach(function (pRole) {
                    var code = pRole.code, role = pRole.role;
                    stream.write("".concat(code, ",").concat(JSON.stringify(role), "\n"));
                });
                stream.end();
                return [2 /*return*/];
            });
        });
    };
    /**
     * Read from CSV containing Superset roles. This file will be loaded to Redis for easier access.
     * @param filePath CSV file with the Superset Roles
     */
    RoleStore.prototype.readFromFile = function (filePath) {
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
    };
    return RoleStore;
}());
exports.RoleStore = RoleStore;
