import { RoleService } from "../src/service/role-service";
import { UserService } from "../src/service/user-service";
import { CreateUserResponse, CSVUser, User } from "../src/types/user";
import { RLSService } from "../src/service/rls-service";
import { generatePassword } from "../src/utils/password.utils";
import { generateUsername } from "../src/utils/string.utils";
import { Logger } from "../src/utils/logger";
import { PermissionService } from "../src/service/permission-service";
import { UpdateRLSRequest } from "../src/types/rls";
import { SupersetRole } from "../src/types/role";
import { RoleAdapter } from "../src/repository/role-adapter";
import fs from "fs";

const roleService = new RoleService();

// Validation functions
function validateCSVUser(user: CSVUser): string[] {
  const errors: string[] = [];

  if (!user.first_name?.trim()) errors.push("First name is required");
  if (!user.last_name?.trim()) errors.push("Last name is required");
  if (!user.email?.trim()) errors.push("Email is required");
  if (user.email && !user.email.includes("@")) errors.push("Invalid email format");
  if (!user.chu?.trim()) errors.push("CHU code is required");

  // If username is provided, validate it
  if (user.username && !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(user.username)) {
    errors.push("Username must start with a letter and contain only letters, numbers, and underscores");
  }

  return errors;
}

// fetch users from CSVdata
async function parseCSV(filePath: string): Promise<CSVUser[]> {
  const csvData = await parseCSV(filePath);
  return csvData;
}

// create users
async function createUsers(users: CSVUser[]): Promise<CreateUserResponse[]> {
  const userManager = new UserService();

  const usersToCreate: User[] = [];
  const roles = await roleService.getRoles();

  const sample = [users[0]];
  Logger.info(`Creating ${sample.length} users`);

  for (const user of sample) {
    const errors = validateCSVUser(user);
    if (errors.length > 0) {
      Logger.error(`User ${user.username} is invalid: ${errors.join(", ")}`);
      continue;
    }

    const password = user.password || generatePassword(10);
    const username = user.username || generateUsername(user.first_name, user.last_name);
    const supersetRoles = roleService.matchRoles(user.chu, roles);

    let roleIds = supersetRoles.map((role) => role.id);
    const permissions = await getChaPermissions();

    // check if there are any role ids and create the associated role if none exists
    if (roleIds.length === 0) {
      Logger.info('Found no existing roles, creating new roles');
      roleIds = await createRoles(user.chu, permissions);
    } else {
      Logger.info('Found existing roles');
      // we update the role permissions and create the rls policies
      updateRolesAndPolicies(supersetRoles, permissions);
    }

    const newUser: User = {
      active: true,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      username,
      password,
      roles: roleIds,
    };

    Logger.info(`Creating user: ${JSON.stringify(newUser, null, 2)}`);

    usersToCreate.push(newUser);
  }

  return await userManager.createUserOnSuperset(usersToCreate);
}

// create roles
async function createRoles(chuCodes: string, permissions: number[]): Promise<number[]> {
  const codes = chuCodes.split(',').map((code) => code.trim());

  // return a map of code to role name
  const detailsMap = new Map<string, string>();
  for (const code of codes) {
    detailsMap.set(code, `cha_${code}`);
  }
  Logger.info(`Creating roles: ${Array.from(detailsMap.values()).join(', ')}`);

  // create roles from map
  const roles = await roleService.createRoles(Array.from(detailsMap.values()));
  if (roles.length > 0) {
    // Create a map of role name to role ID for quick lookup
    const roleNameToId = new Map(roles.map(role => [role.name, role.id]));

    const updatedRoles = await roleService.updateRolePermissions(roles, permissions);

    // Create RLS policies with associated roles
    const rlsPolicies = Array.from(detailsMap.entries()).map(([code, roleName]) => {
      const roleId = roleNameToId.get(roleName);
      if (!roleId) {
        Logger.warning(`No role ID found for role name: ${roleName}`);
        return null;
      }
      return {
        code,
        roleIds: [roleId]
      };
    }).filter((policy): policy is NonNullable<typeof policy> => policy !== null);

    await createRLSPolicies(rlsPolicies);

    return updatedRoles;
  }

  return []
}

async function getChaPermissions() {
  const permissionService = new PermissionService();
  const permissions = await permissionService.fetchBasePermissions();
  return permissions;
}

// create RLS policies for new roles
async function createRLSPolicies(policies: Array<{ code: string, roleIds: number[] }>) {
  const rlsService = new RLSService();
  const baseRLSPolicy = await rlsService.fetchBaseRLS(rlsService.BASE_CHU_RLS_ID);

  const requests: UpdateRLSRequest[] = policies.map(({ code, roleIds }) => {
    const rlsName = `cha_${code}`;
    Logger.info(`Creating RLS policy ${rlsName} for roles: ${roleIds.join(', ')}`);

    return {
      name: rlsName,
      group_key: baseRLSPolicy.group_key,
      clause: 'chu_code=' + code,
      description: baseRLSPolicy.description,
      filter_type: baseRLSPolicy.filter_type,
      roles: roleIds,
      tables: baseRLSPolicy.tables.map(table => table.id)
    };
  });

  await Promise.all(requests.map(request => rlsService.createRLSPolicy(request)));
}

async function updateRolesAndPolicies(supersetRoles: SupersetRole[], permissions: number[]) {
  const updatedRoles = await roleService.updateRolePermissions(supersetRoles, permissions);
  Logger.info(`Updated roles: ${updatedRoles}`);

  const rlsService = new RLSService();
  const baseRLSPolicy = await rlsService.fetchBaseRLS(rlsService.BASE_CHU_RLS_ID);

  // create RLS policies with associated roles
  const rlsPolicies = supersetRoles.map(role => {
    const chuCode = new RoleAdapter().extractCHUCode(role.name);

    return {
      name: `cha_${chuCode}`,
      group_key: baseRLSPolicy.group_key,
      clause: 'chu_code=' + chuCode,
      description: baseRLSPolicy.description,
      filter_type: baseRLSPolicy.filter_type,
      roles: [role.id],
      tables: baseRLSPolicy.tables.map(table => table.id)
    };
  });

  await Promise.all(rlsPolicies.map(request => rlsService.createRLSPolicy(request)));
  Logger.info(`Created RLS policies for roles: ${supersetRoles.map(role => role.name).join(', ')}`);
}

// generate a csv of user details
async function generateCSV(users: CreateUserResponse[]) {
  const csv = users.map(user => {
    return {
      username: user.result.username,
      password: user.result.password,
      first_name: user.result.first_name,
      last_name: user.result.last_name,
      email: user.result.email
    };
  });

  // write csv to file
  // Convert to CSV string
  const csvString = csv.map(row => Object.values(row).join(',')).join('\n');

  // Write file using Node.js method
  fs.writeFile('users.csv', csvString, 'utf8', (err) => {
    if (err) {
      Logger.error(err);
    } else {
    Logger.success('CSV file created successfully');
  }
  });
}

// putting it all together
async function createUsersFromCSV(filePath: string) {
  try {
    Logger.info(`Starting user creation process from CSV: ${filePath}`);
    const users = await parseCSV(filePath);
    Logger.info(`Found ${users.length} users in CSV file`);
    
    const createdUsers = await createUsers(users);
    Logger.info(`Successfully created ${createdUsers.length} users`);
    
    await generateCSV(createdUsers);
    Logger.success('Process completed successfully');
  } catch (error) {
    Logger.error('Process failed:', error);
    throw error;
  }
}

// execute the script
createUsersFromCSV(process.argv[2] || 'data/wundanyi.csv').catch((error) => {
  Logger.error('Script failed:', error);
  process.exit(1);
});