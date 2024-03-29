"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CHA_TABLES = exports.SUPERSET = void 0;
var dotenv = __importStar(require("dotenv"));
dotenv.config();
exports.SUPERSET = {
    username: getEnvironmentVariable('SUPERSET_USERNAME', 'admin'),
    password: getEnvironmentVariable('SUPERSET_PASSWORD', 'admin'),
    baseURL: getEnvironmentVariable('SUPERSET_BASE_URL', 'http://localhost:8088'),
    apiPath: getEnvironmentVariable('SUPERSET_API_PATH', '/api/v1'),
    trustSelfSigned: true,
};
exports.CHA_TABLES = getEnvironmentVariable('CHA_TABLES', '[]');
function getEnvironmentVariable(env, def) {
    if (process.env.NODE_ENV === 'test') {
        return def;
    }
    return process.env[env] || def;
}
