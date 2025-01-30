import { RoleService } from "../src/service/role-service";
import { UserService } from "../src/service/user-service";
import { CreateUserResponse, CHAUser, User } from "../src/types/user";
import { RLSService } from "../src/service/rls-service";
import { generatePassword } from "../src/utils/password.utils";
import { generateUsername } from "../src/utils/string.utils";
import { Logger } from "../src/utils/logger";
import { PermissionService } from "../src/service/permission-service";
import { UpdateRLSRequest } from "../src/types/rls";
import { ParsedRole, SupersetRole } from "../src/types/role";
import { RoleAdapter } from "../src/repository/role-adapter";
import fs from "fs";
import { readUsersFromFile } from "../src/repository/csv-util";
import { RedisService } from "../src/repository/redis-util";

// Initialize services
const roleService = new RoleService();

// Validation functions
function validateUserDetails(user: CHAUser): string[] {
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

// create users
async function prepareUserData(csvUser: CHAUser, roles: ParsedRole[]): Promise<User | null> {
  const errors = validateUserDetails(csvUser);
  if (errors.length > 0) {
    Logger.error(`User ${csvUser.username} is invalid: ${errors.join(", ")}`);
    return null;
  }

  return {
    active: true,
    first_name: capitalizeFirstLetter(csvUser.first_name.trim()),
    last_name: capitalizeFirstLetter(csvUser.last_name.trim()),
    email: csvUser.email.trim(),
    username: csvUser.username.trim() || generateUsername(csvUser.first_name, csvUser.last_name),
    password: csvUser.password.trim().replace(/^["']|["']$/g, '') || generatePassword(10),
    roles: await getRoleIds(csvUser.chu, roles)
  };
}

function capitalizeFirstLetter(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

async function getRoleIds(chuCode: string, existingRoles: ParsedRole[]): Promise<number[]> {
  const supersetRoles = roleService.matchRoles(chuCode, existingRoles);
  const permissions = await getChaPermissions();

  if (supersetRoles.length === 0) {
    Logger.info('Found no existing roles, creating new roles');
    return createRoles(chuCode, permissions);
  }

  Logger.info('Found existing roles, updating permissions');
  await updateRolesAndPolicies(supersetRoles, permissions);
  return supersetRoles.map(role => role.id);
}

async function createUsers(users: CHAUser[]): Promise<CreateUserResponse[]> {
  const roles = await roleService.getRoles();
  if (roles.length === 0) {
    throw new Error("No roles found");
  }
  
  const userPromises = users.map(user => prepareUserData(user, roles));
  const preparedUsers = (await Promise.all(userPromises)).filter((user): user is User => user !== null);

  if (preparedUsers.length === 0) {
    throw new Error("No valid users found");
  }

  return new UserService().createUserOnSuperset(preparedUsers);
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

async function getChaPermissions(): Promise<number[]> {
  const permissionService = new PermissionService();
  return await permissionService.fetchBasePermissions();
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
      clause: `chu_code=\'${code}\'`,
      description: 'RLS Policy for CHU ' + code,
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
  Logger.info('Fetched base RLS policy');

  // create RLS policies with associated roles
  const rlsPolicies = supersetRoles.map(role => {
    const chuCode = new RoleAdapter().extractCHUCode(role.name);

    return {
      name: `cha_${chuCode}`,
      group_key: baseRLSPolicy.group_key,
      clause: `chu_code=\'${chuCode}\'`,
      description: 'RLS Policy for CHU ' + chuCode,
      filter_type: baseRLSPolicy.filter_type,
      roles: [role.id],
      tables: baseRLSPolicy.tables.map(table => table.id)
    };
  });
  Logger.info(`Creating RLS policies for roles: ${supersetRoles.map(role => role.name).join(', ')}`);

  await Promise.all(rlsPolicies.map(request => rlsService.createRLSPolicy(request)));
  Logger.info(`Created RLS policies for roles: ${supersetRoles.map(role => role.name).join(', ')}`);
}

// generate a csv of user details
async function generateCSV(users: CreateUserResponse[], filePath: string) {
  const csv = users.map(user => {
    return {
      username: user.result.username,
      password: user.result.password,
      first_name: user.result.first_name,
      last_name: user.result.last_name,
      email: user.result.email
    };
  });

  Logger.info(`Generating CSV file at ${filePath} with ${csv.length} users`);

  // write csv to file
  // Add headers and convert to CSV string
  const headers = ['username', 'password', 'first name', 'last name', 'email'].join(',');
  const csvRows = csv.map(row => Object.values(row).join(','));
  const csvString = [headers, ...csvRows].join('\n');
  const fileName = getFileName(filePath);

  try {
    // Write file synchronously to ensure it's written before continuing
    fs.writeFileSync(fileName, csvString, 'utf8');
    Logger.success(`CSV file created successfully at ${fileName}`);
  } catch (err) {
    Logger.error(`Failed to write CSV file: ${err}`);
    throw err;
  }
}

// putting it all together
async function createUsersFromCSV(filePath: string) {
  try {
    Logger.info(`Starting user creation process from CSV: ${filePath}`);
    const users = await readUsersFromFile<CHAUser>(filePath);
    Logger.info(`Found ${users.length} users in CSV file`);

    const createdUsers = await createUsers(users);
    Logger.info(`Created ${createdUsers.length} users`);

    if(createdUsers.length === 0) {
      throw new Error('No users created');
    }

    await generateCSV(createdUsers, filePath);
    Logger.success('Process completed successfully');
  } catch (error) {
    Logger.error(`Process failed: ${error}`);
    throw error;
  }
}

// generate a filename from file path by suffixing with -users
const getFileName = (filePath: string) => {
  return filePath.split('.')[0] + '-users.csv';
}

// execute the script
createUsersFromCSV(process.argv[2])
  .catch((error) => {
    Logger.error('Script failed:', error);
  })
  .finally(async () => {
    try {
      // Clean up Redis connection after all operations are complete
      await RedisService.disconnect();
    } finally {
      process.exit(0); // Exit with success code if everything completed
    }
  });