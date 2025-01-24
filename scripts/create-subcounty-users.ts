import { Logger } from '../src/utils/logger';
import { generatePassword } from '../src/utils/password.utils';
import { PermissionService } from '../src/service/permission-service';
import { readUsersFromFile } from '../src/repository/csv-util';
import { RoleService } from '../src/service/role-service';
import { RLSService } from '../src/service/rls-service';
import { UpdateRLSRequest } from '../src/types/rls';
import { User } from '../src/types/user';
import { UserService } from '../src/service/user-service';

const CSV_FILENAME = './subcounty-users.csv';

const BASE_SUBCOUNTY_ROLE_ID = 3585;

type SubcountyAccountRequest = {
  county: string;
  subcounty?: string;
  email: string;
};

type UserCreationResult = {
  username: string;
  password: string;
  email: string;
};

async function getBasePermissions(): Promise<number[]> {
  const permissionService = new PermissionService();
  return await permissionService.getPermissionsByRoleId(BASE_SUBCOUNTY_ROLE_ID);
}

function subcountyUsername(request: SubcountyAccountRequest): string {
  const transform = (val: string) => val.toLowerCase().replace(/ /g, '_').trim();
  let result = `${transform(request.county)}`;
  if (request.subcounty) {
    result += `_${transform(request.subcounty)}`;
  }
  
  return result;
}

async function createRole(subcountyRequest: SubcountyAccountRequest): Promise<number> {
  Logger.info('Creating role from base...');
  const basePermissionIds = await getBasePermissions();
  const roleService = new RoleService();
  const roleName = `subcounty_${subcountyUsername(subcountyRequest)}`;
  const roles = await roleService.createRoles([roleName]);
  await roleService.updateRolePermissions(roles, basePermissionIds);
  return roles[0].id;
}

function getRLSClause(subcountyRequest: SubcountyAccountRequest): string {
  let clause = `county='${subcountyRequest.county}'`;
  if (subcountyRequest.subcounty) {
    clause += ` AND subcounty_name='${subcountyRequest.subcounty}'`;
  }

  return clause;
}

async function createRLSPolicy(subcountyRequest: SubcountyAccountRequest, roleId: number) {
  Logger.info('Creating an RLS...');
  const rlsService = new RLSService();
  const clause = getRLSClause(subcountyRequest);
  const rlsRequest: UpdateRLSRequest = {
    name: `subcounty_${subcountyUsername(subcountyRequest)}`,
    group_key: '',
    clause,
    description: `RLS Policy for Subcounty ${subcountyRequest.county}.${subcountyRequest.subcounty}`,
    filter_type: 'Regular',
    roles: [roleId],
    tables: [241],
  };

  const rlsResponse = await rlsService.createRLSPolicy(rlsRequest);
  Logger.info(`Resulting RLS ID: ${rlsResponse.id}`);
}

async function createUser(subcountyRequest: SubcountyAccountRequest, roleId: number): Promise<UserCreationResult> {
  const user: User = {
    active: true,
    first_name: subcountyRequest.subcounty || '',
    last_name: subcountyRequest.county,
    email: subcountyRequest.email,
    username: subcountyUsername(subcountyRequest),
    password: generatePassword(10),
    roles: [roleId]
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
    if (!subcountyRequest.county?.trim()) {
      throw Error(`County information is required`);
    }

    if (!subcountyRequest.email?.trim()) {
      throw Error(`Email information is required`);
    }
  }
}

(async function() {
  const subcountyRequests = await readUsersFromFile<SubcountyAccountRequest>(CSV_FILENAME);

  validateAccountRequests(subcountyRequests);

  const userResults: UserCreationResult[] = [];
  for (const subcountyRequest of subcountyRequests) {
    Logger.info(`Creating ${subcountyUsername(subcountyRequest)}:`);
    const roleId = await createRole(subcountyRequest);
    await createRLSPolicy(subcountyRequest, roleId);
    const userResult = await createUser(subcountyRequest, roleId);
    userResults.push(userResult);
  }

  console.table(userResults);
})();