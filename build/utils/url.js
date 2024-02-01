"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveUrl = void 0;
var url = require('url');
var resolveUrl = function (baseUrl, path) { return url.resolve(baseUrl, path); };
exports.resolveUrl = resolveUrl;
