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
exports.getFormattedHeaders = exports.getCSRFToken = exports.loginResult = exports.API_URL = void 0;
var config_1 = require("../config/config");
var node_fetch_1 = __importDefault(require("node-fetch"));
var url_1 = require("./url");
exports.API_URL = (0, url_1.resolveUrl)(config_1.SUPERSET.baseURL, config_1.SUPERSET.apiPath);
// Helper function to handle fetch requests and return both json and headers
function fetchFromAPI(endpoint, options) {
    return __awaiter(this, void 0, void 0, function () {
        var response, json, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, (0, node_fetch_1.default)(endpoint, options)];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("HTTP error! status: ".concat(response.status));
                    }
                    return [4 /*yield*/, response.json()];
                case 2:
                    json = _a.sent();
                    return [2 /*return*/, { json: json, headers: response.headers }];
                case 3:
                    error_1 = _a.sent();
                    console.error('Fetching error:', error_1);
                    throw error_1;
                case 4: return [2 /*return*/];
            }
        });
    });
}
var loginResult = function () { return __awaiter(void 0, void 0, void 0, function () {
    var body, _a, json, headers, cookie;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                body = {
                    username: config_1.SUPERSET.username,
                    password: config_1.SUPERSET.password,
                    provider: "db"
                };
                return [4 /*yield*/, fetchFromAPI("".concat(exports.API_URL, "/security/login"), {
                        method: 'POST',
                        body: JSON.stringify(body),
                        headers: { 'Content-Type': 'application/json' }
                    })];
            case 1:
                _a = _c.sent(), json = _a.json, headers = _a.headers;
                cookie = (_b = headers.get('Set-Cookie')) !== null && _b !== void 0 ? _b : '';
                return [2 /*return*/, { bearerToken: json.access_token, cookie: cookie }];
        }
    });
}); };
exports.loginResult = loginResult;
var getCSRFToken = function (bearerToken) { return __awaiter(void 0, void 0, void 0, function () {
    var headers, data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                headers = {
                    'Authorization': "Bearer ".concat(bearerToken)
                };
                return [4 /*yield*/, fetchFromAPI("".concat(exports.API_URL, "/security/csrf_token/"), {
                        method: 'GET',
                        headers: headers
                    }).then(function (res) { return res.json; })];
            case 1:
                data = _a.sent();
                return [2 /*return*/, data.result];
        }
    });
}); };
exports.getCSRFToken = getCSRFToken;
var getFormattedHeaders = function (bearerToken, csrfToken, cookie) { return ({
    'Authorization': "Bearer ".concat(bearerToken),
    'Content-Type': 'application/json',
    'X-CSRFToken': csrfToken,
    'Cookie': cookie
}); };
exports.getFormattedHeaders = getFormattedHeaders;
