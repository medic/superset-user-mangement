import path from 'path';
import { Logger } from '../src/utils/logger';
import { generatePassword } from '../src/utils/password.utils';
import { readUsersFromFile } from '../src/repository/csv-util';
import { RoleService } from '../src/service/role-service';
import { RLSService } from '../src/service/rls-service';
import { UpdateRLSRequest } from "../src/types";
import { User } from "../src/types";
import { UserService } from '../src/service/user-service';
import fs from 'fs';
import { SupersetRole } from "../src/types";
import { capitalizeWords } from '../src/utils/string.utils';

const CSV_FILENAME = path.join(__dirname, '../data/wajir.csv');

const DASHBOARD_VIEWER_ROLE_ID = 6;

export type SubcountyAccountRequest = {
  name: string;
  county: string;
  subcounty: string;
  email: string;
};

type UserCreationResult = {
  username: string;
  password: string;
  email: string;
};

async function getRole(roleName: string): Promise<SupersetRole | null> {
  const roleService = new RoleService();
  const roleList = await roleService.getRoleByName(roleName);
  Logger.info(`Role ${roleName} found: ${roleList.result[0]?.id}`);
  return roleList.result[0] || null;
}

export function getSubcountyRole(subcounty: string): string {
  const transform = (val: string) => val.toLowerCase().trim();

  const subcountyName = transform(subcounty);

  if (subcountyName.includes('subcounty')) {
    return capitalizeWords(subcountyName);
  } else {
    return capitalizeWords(`${subcountyName} Subcounty`);
  }
}

async function createRole(subcounty: string): Promise<number> {
  Logger.info(`Creating ${getSubcountyRole(subcounty)} role...`);

  const role = await getRole(getSubcountyRole(subcounty));

  if (role) {
    return role.id;
  }

  const roleService = new RoleService();
  const roleName = getSubcountyRole(subcounty);
  const roles = await roleService.createRoles([roleName]);
  return roles[0].id;
}

function getRLSClause(subcounty: string): string {  
  const transform = (val: string) => val.toLowerCase().trim();
  const subcountyName = transform(subcounty);
  const key = capitalizeWords(subcountyName);

  const clause = `sub_county_name='${key}'`;
  return clause;
}

async function createRLSPolicy(subcounty: string, roleId: number): Promise<number> {
  const rlsService = new RLSService();
  const rls = await rlsService.getRLSByName(`${getSubcountyRole(subcounty)} RLS`);
  if (rls) {
    return rls.id;
  }

  const subcountyName = getSubcountyRole(subcounty);
  Logger.info(`Creating ${subcountyName} RLS...`);

  const clause = getRLSClause(subcounty);

  const supervisorTables = await rlsService.fetchRLSTables(rlsService.BASE_COUNTY_RLS_ID);

  const rlsRequest: UpdateRLSRequest = {
    name: `${subcountyName} RLS`,
    group_key: 'sub_county_name',
    clause,
    description: `RLS Policy for ${subcountyName}`,
    filter_type: 'Regular',
    roles: [roleId],
    tables: [...supervisorTables],
  };

  const rlsResponse = await rlsService.createRLSPolicy(rlsRequest);
  Logger.info(`Created ${subcountyName} RLS with ID: ${rlsResponse.id}`);
  return rlsResponse.id;
}

async function createUser(subcountyRequest: SubcountyAccountRequest, roleId: number): Promise<UserCreationResult> {
  const name = subcountyRequest.name.trim().toLowerCase().split(' ');

  const user: User = {
    active: true,
    first_name: name[0],
    last_name: name[1] || '',
    email: subcountyRequest.email,
    username: subcountyRequest.name.trim().toLowerCase().replace(/ /g, ''),
    password: generatePassword(10),
    roles: [roleId, DASHBOARD_VIEWER_ROLE_ID]
  };

  const userService = new UserService();
  const userResponses = await userService.createUserOnSuperset([user]);
  const { username, password } = userResponses[0].result;
  return {
    email: subcountyRequest.email,
    username,
    password,
  };
}

function validateAccountRequests(subcountyAccountRequests: SubcountyAccountRequest[]): void {
  for (const subcountyRequest of subcountyAccountRequests) {
    console.log(subcountyRequest)

    if (!subcountyRequest.subcounty?.trim()) {
      throw Error(`Subcounty information is required`);
    }

    if (!subcountyRequest.email?.trim()) {
      throw Error(`Email information is required`);
    }
  }
}

// generate CSV of subcounty users
function generateCSV(userResults: UserCreationResult[], filePath: string) {
  const csv = userResults.map(user => {
    return {
      username: user.username,
      password: user.password,
      email: user.email
    };
  });

  // Add headers and convert to CSV string
  const headers = ['username', 'password', 'email'].join(',');
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
  const subcountyRequests = await readUsersFromFile<SubcountyAccountRequest>(CSV_FILENAME);

  validateAccountRequests(subcountyRequests);

  console.table(subcountyRequests);

  const userResults: UserCreationResult[] = [];
  for (const subcountyRequest of subcountyRequests) {
    const subcounty = subcountyRequest.subcounty;
    Logger.info(`Creating ${subcounty} user:`);
    const roleId = await createRole(subcounty);
    await createRLSPolicy(subcounty, roleId);
    const userResult = await createUser(subcountyRequest, roleId);
    userResults.push(userResult);
  }

  console.table(userResults);
  generateCSV(userResults, CSV_FILENAME);
  process.exit(0);
})();
