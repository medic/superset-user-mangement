/**
 * This script creates county users from a CSV file. This is different from county accounts that 
 * The CSV file should have the following columns:
 * - county
 * - password
 * - email
 * - username
 */

import path from "path";
import { RowLevelSecurity } from "../src/types/rls";
import { RLSService } from "../src/service/rls-service";
import { User } from "../src/types/user";
import { UserService } from "../src/service/user-service";
import { RoleService } from "../src/service/role-service";
import { RoleList, SupersetRole } from "../src/types/role";
import { readUsersFromFile } from "../src/repository/csv-util";
import { Logger } from "../src/utils/logger";
import fs from 'fs';

const CSV_FILENAME = path.join(__dirname, '../data/county-users.csv');
const DASHBOARD_VIEWER = "Dashboard Viewer";

type CountySubaccountRequest = {
    first_name: string;
    last_name: string;
    email: string;
    county_name: string;
    password: string;
    username: string;
}

type UserCreationResult = {
    first_name: string;
    last_name: string;
    username: string;
    password: string;
    email: string;
}   


function validateAccountRequests(countyAccountRequests: CountySubaccountRequest[]): void {
    for (const countyRequest of countyAccountRequests) {
      if (!countyRequest.first_name?.trim()) {
        throw Error(`First name is required`);
      }

      if (!countyRequest.last_name?.trim()) {
        throw Error(`Last name is required`);
      }
  
      if (!countyRequest.username?.trim()) {
        throw Error(`Username is required`);
      }
  
      if (!countyRequest.email?.trim()) {
        throw Error(`Email is required`);
      }
    }
  }
  
const capitalize = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function getRLS(countyName: string): Promise<RowLevelSecurity | null> {
    const rlsService = new RLSService();
    return rlsService.getRLSByName(`${countyName} RLS`);
}

function getCountyRoles(roleNames: string[]): Promise<RoleList> {
    const roleService = new RoleService();
    return roleService.getRolesByName(roleNames);
}

async function createUser(countyRequest: CountySubaccountRequest, roleIds: number[]): Promise<UserCreationResult> {
    const user: User = {
      active: true,
      first_name: countyRequest.first_name,
      last_name: countyRequest.last_name,
      email: countyRequest.email,
      username: countyRequest.username,
      password: countyRequest.password,
      roles: roleIds
    };
  
    const userService = new UserService();
    const userResponses = await userService.createUserOnSuperset([user]);
    const { first_name, last_name, username, password } = userResponses[0].result;
    return {
      first_name,
      last_name,
      email: countyRequest.email,
      username,
      password,
    };
  }

  // generate CSV of subcounty users
function generateCSV(userResults: UserCreationResult[], filePath: string) {
    const csv = userResults.map(user => {
      return {
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        password: user.password,
        email: user.email,
      };
    });
  
    // Add headers and convert to CSV string
    const headers = ['first_name', 'last_name', 'username', 'password', 'email'].join(',');
    const csvRows = csv.map(row => Object.values(row).join(','));
    const csvString = [headers, ...csvRows].join('\n');
    const fileName = filePath.split('.')[0] + '-users.csv';
  
    try {
      // Write file synchronously to ensure it's written before continuing
      fs.writeFileSync(fileName, csvString, 'utf8');
      Logger.success(`CSV file created successfully at ${fileName}`);
    } catch (err) {
      Logger.error(`Failed to write CSV file: ${err}`);
      throw err;
    }
  }

  (async function () {
    const countyRequests = (await readUsersFromFile<CountySubaccountRequest>(CSV_FILENAME));

    validateAccountRequests(countyRequests);
    
    const userResults: UserCreationResult[] = [];
    Logger.info(`Total users: ${countyRequests.length}`);
    Logger.info(`Users: ${JSON.stringify(countyRequests)}`);

    for (const countyRequest of countyRequests) {
        const roles = await getCountyRoles([countyRequest.county_name, DASHBOARD_VIEWER]);
        const userResult = await createUser(countyRequest, roles.ids);
        userResults.push(userResult);
    }

    console.table(userResults);
    generateCSV(userResults, CSV_FILENAME);
    process.exit(0);
  })();


