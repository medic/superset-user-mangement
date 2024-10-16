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
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSupersetUsers = exports.createUserAccounts = exports.generateUser = void 0;
var superset_1 = require("./superset");
var redis_1 = require("redis");
var role_1 = require("./role");
var generateUser = function (rawObj, rolesArray) {
    var first_name = rawObj.first_name, last_name = rawObj.last_name, email = rawObj.email, username = rawObj.username, password = rawObj.password;
    return {
        active: true,
        first_name: first_name,
        last_name: last_name,
        email: email,
        username: username,
        password: password,
        roles: rolesArray,
    };
};
exports.generateUser = generateUser;
function createUserAccounts(users, headers) {
    return __awaiter(this, void 0, void 0, function () {
        var _i, users_1, user, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _i = 0, users_1 = users;
                    _a.label = 1;
                case 1:
                    if (!(_i < users_1.length)) return [3 /*break*/, 4];
                    user = users_1[_i];
                    console.log(JSON.stringify(user));
                    return [4 /*yield*/, (0, superset_1.postRequest)(headers, "/security/users/", user)];
                case 2:
                    response = _a.sent();
                    console.log(response);
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.createUserAccounts = createUserAccounts;
function generateSupersetUsers(users) {
    return __awaiter(this, void 0, void 0, function () {
        var supersetUsers, redisClient;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    supersetUsers = [];
                    redisClient = (0, redis_1.createClient)();
                    return [4 /*yield*/, redisClient.connect()];
                case 1:
                    _a.sent();
                    users.forEach(function (user) {
                        var chuCodes = (0, role_1.getCHUCodes)(user.chu);
                        var roles = [];
                        chuCodes.forEach(function (chuCode) {
                            var role = redisClient.hGet(chuCode, "role");
                        });
                        supersetUsers.push((0, exports.generateUser)(user, roles));
                    });
                    return [2 /*return*/, supersetUsers];
            }
        });
    });
}
exports.generateSupersetUsers = generateSupersetUsers;
// export function createNewSupersetUser(csvUser: CSVUser, dashboardViewerPermissions:): User {
//   const role = generateRole(csvUser.role, csvUser.place);
//   const rolePermissions = generatePermissions(dashboardViewerPermissions);
//   let result = await postRequest(
//     API_URL,
//     headers,
//     `/security/roles/`,
//     stringifyRequest(role)
//   );
//   const createdRole = result as { id: string };
//   const rowLevelSecurity = generateRowLevelSecurity(
//     [createdRole.id],
//     `chu_code`,
//     row.place,
//     CHA_TABLES
//   );
