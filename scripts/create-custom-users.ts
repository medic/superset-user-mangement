/**
 * This script creates custom users in Superset that are meant to have access to specific dashboards.
 * These users fall outside of the normal user provisioning process and are not associated with any specific subcounty or county.
 * They only have access to the dashboards that are shared with them and do not have access to any other resources in Superset.
 *
 * The CSV file should have the following columns:
 * - name (full name, split into first_name and last_name)
 * - email
 *
 * Users are assigned role ID 92 and passwords are auto-generated.
 */

import path from "path";
import { User } from "../src/types";
import { UserService } from "../src/service/user-service";
import { readUsersFromFile } from "../src/repository/csv-util";
import { Logger } from "../src/utils/logger";
import { generatePassword } from "../src/utils/password.utils";
import { generateUsername } from "../src/utils/string.utils";
import fs from 'fs';

const CSV_FILENAME = path.join(__dirname, '../data/febrile.csv');
const ROLE_ID = 92;

type FebrileUserRequest = {
    name: string;
    email: string;
}

type UserCreationResult = {
    first_name: string;
    last_name: string;
    username: string;
    password: string;
    email: string;
}

function validateRequests(requests: FebrileUserRequest[]): void {
    for (const request of requests) {
        if (!request.name?.trim()) {
            throw Error(`Name is required`);
        }
        if (!request.email?.trim()) {
            throw Error(`Email is required`);
        }
    }
}

function parseName(fullName: string): { first_name: string; last_name: string } {
    const parts = fullName.trim().split(/\s+/);
    const first_name = parts[0];
    const last_name = parts.slice(1).join(' ');
    return { first_name, last_name: last_name || first_name };
}

async function createUser(request: FebrileUserRequest): Promise<UserCreationResult> {
    const { first_name, last_name } = parseName(request.name);
    const username = generateUsername(first_name, last_name);
    const password = generatePassword(12);

    const user: User = {
        active: true,
        first_name,
        last_name,
        email: request.email,
        username,
        password,
        roles: [ROLE_ID]
    };

    const userService = new UserService();
    await userService.createUserOnSuperset([user]);
    return { first_name, last_name, username, password, email: request.email };
}

function generateCSV(userResults: UserCreationResult[], filePath: string) {
    const headers = ['first_name', 'last_name', 'username', 'password', 'email'].join(',');
    const csvRows = userResults.map(row => Object.values(row).join(','));
    const csvString = [headers, ...csvRows].join('\n');
    const fileName = filePath.split('.')[0] + '-users.csv';

    try {
        fs.writeFileSync(fileName, csvString, 'utf8');
        Logger.success(`CSV file created successfully at ${fileName}`);
    } catch (err) {
        Logger.error(`Failed to write CSV file: ${err}`);
        throw err;
    }
}

(async function () {
    const requests = (await readUsersFromFile<FebrileUserRequest>(CSV_FILENAME)); // Limit to first 10 users for testing

    validateRequests(requests);

    const userResults: UserCreationResult[] = [];
    Logger.info(`Total users: ${requests.length}`);

    for (const request of requests) {
        const userResult = await createUser(request);
        userResults.push(userResult);
    }

    console.table(userResults);
    generateCSV(userResults, CSV_FILENAME);
    process.exit(0);
})();
