"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveUrl = void 0;
var url_1 = __importDefault(require("url"));
var resolveUrl = function (baseUrl, path) {
    return url_1.default.resolve(baseUrl, path);
};
exports.resolveUrl = resolveUrl;
