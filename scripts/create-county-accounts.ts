// Script for creating county users

import path from 'path';
import { Logger } from '../src/utils/logger';
import { readUsersFromFile } from '../src/repository/csv-util';
import { RLSService } from '../src/service/rls-service';
import { UpdateRLSRequest } from '../src/types/rls';
import { User } from '../src/types/user';
import { UserService } from '../src/service/user-service';
import fs from 'fs';
import { RoleService } from '../src/service/role-service';

const CSV_FILENAME = path.join(__dirname, '../data/county-users.csv');

const BASE_COUNTY_ROLE_ID = 6;

type CountyAccountRequest = {
  county: string;
  subcounty: string;
  password: string;
  email: string;
  username: string;
};

type UserCreationResult = {
  first_name: string;
  last_name: string;
  username: string;
  password: string;
  email: string;
};

function getRLSClause(countyRequest: CountyAccountRequest): string {
  return `county_name='${countyRequest.county}'`;
}

const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

async function createRLSPolicy(countyRequest: CountyAccountRequest, roleId: number) {
  Logger.info('Creating an RLS...');

  const rlsService = new RLSService();
  const clause = getRLSClause(countyRequest);

  const countyTables = await rlsService.fetchBaseCountyTables();

  const countyName = transformCountyName(countyRequest.county);

  const rlsRequest: UpdateRLSRequest = {
    name: `${countyName} RLS`,
    group_key: 'county_name',
    clause,
    description: `RLS Policy for ${countyName}`,
    filter_type: 'Regular',
    roles: [roleId],
    tables: [...countyTables],
  };

  const rlsResponse = await rlsService.createRLSPolicy(rlsRequest);
  Logger.info(`Resulting RLS ID: ${rlsResponse.id}`);
}

const transformCountyName = (countyName: string) => {
  return countyName?.split(' ').map(word => 
    capitalize(word)
  );
}

/**
 * Create role for county without permissions. 
 * Permissions will be inherited from the Dashboard Viewer Role.
 */
async function createRole(countyName: string): Promise<number> {
  Logger.info('Creating role...');
  const roleService = new RoleService();
  const roleName = transformCountyName(countyName).join(" ");
  const roles = await roleService.createRoles([roleName]);
  return roles[0].id;
}

async function createUser(countyRequest: CountyAccountRequest, roleId: number): Promise<UserCreationResult> {
  const countyName = transformCountyName(countyRequest.county);
  const countyEmail = `${countyName?.[0].toLowerCase()}@county.com`;

  const user: User = {
    active: true,
    first_name: countyName?.[0] || countyRequest.county || '',
    last_name: countyName?.[1] || 'County',
    email: countyEmail,
    username: countyRequest.username,
    password: countyRequest.password,
    roles: [BASE_COUNTY_ROLE_ID, roleId]
  };

  const userService = new UserService();
  const userResponses = await userService.createUserOnSuperset([user]);
  const { first_name, last_name, username, password } = userResponses[0].result;
  return {
    first_name,
    last_name,
    email: countyEmail,
    username,
    password,
  };
}

function validateAccountRequests(countyAccountRequests: CountyAccountRequest[]): void {
  for (const countyRequest of countyAccountRequests) {
    if (!countyRequest.county?.trim()) {
      throw Error(`County information is required`);
    }

    if (!countyRequest.username?.trim()) {
      throw Error(`Username is required`);
    }

    if (!countyRequest.password?.trim()) {
      throw Error(`Password is required`);
    }
  }
}

// generate CSV of subcounty users
function generateCSV(userResults: UserCreationResult[], filePath: string) {
  const csv = userResults.map(user => {
    return {
      county: user.first_name + ' ' + user.last_name,
      password: user.password,
      username: user.username
    };
  });

  // Add headers and convert to CSV string
  const headers = ['county', 'password', 'username'].join(',');
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
  const countyRequests = (await readUsersFromFile<CountyAccountRequest>(CSV_FILENAME));

  validateAccountRequests(countyRequests);
  
  const userResults: UserCreationResult[] = [];
  Logger.info(`Total counties: ${countyRequests.length}`);
  Logger.info(`Counties: ${JSON.stringify(countyRequests)}`);

  for (const countyRequest of countyRequests) {
    const roleId = await createRole(countyRequest.county);
    Logger.info(`Creating ${countyRequest.county} user`);
    await createRLSPolicy(countyRequest, roleId);
    const userResult = await createUser(countyRequest, roleId);
    userResults.push(userResult);
  }

  console.table(userResults);
  generateCSV(userResults, CSV_FILENAME);
  process.exit(0);
})();