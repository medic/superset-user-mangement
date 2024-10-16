"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var auth_manager_1 = require("./v2/auth-manager");
var config_1 = require("./v2/config");
var csv_util_1 = require("./v2/csv-util");
/**
 * App entry point
 */
var App = /** @class */ (function () {
    function App(filePath) {
        this.authManager = new auth_manager_1.AuthManager();
        this.filePath = filePath;
    }
    App.prototype.readUsersFromCSV = function () {
        console.log(this.filePath);
        var users = (0, csv_util_1.parseCSV)(this.filePath);
        return users;
    };
    return App;
}());
var app = new App(config_1.DATA_FILE_PATH);
var users = app.readUsersFromCSV();
console.table(users);
