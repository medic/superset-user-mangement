"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveUrl = void 0;
var url_1 = require("url");
var resolveUrl = function (baseUrl, path) {
    var url = new url_1.URL(path, baseUrl);
    return url.toString();
};
exports.resolveUrl = resolveUrl;
