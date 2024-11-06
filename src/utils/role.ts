import {fetchRequest, initRequest} from "./superset";
import {createClient} from "redis";
import rison from "rison";
import fs from "fs";
import csv from "csv-parser";
import {chaPermissionList, MenuIds, updatePermissions} from "./permissions";

interface RoleList {
  count: number;
  ids: number[];
  result: SupersetRole[];
}

export interface SupersetRole {
  id: number;
  name: string;
}

type ParsedRole = {
  code: string;
  role: SupersetRole;
};

// export const getRoles = async (headers: any): Promise<SupersetRole[]> => {
//   const request = initRequest('GET', headers);
//
//   const queryParams = rison.encode({"page": 0, "page_size": 100});
//   const roleList: RoleList = await fetchRequest(`/security/roles?q=${queryParams}`, request) as RoleList;
//
//   const formattedRoles = formatRoles(roleList.result);
//   writeToCSV(formattedRoles, "output.csv");
//
//   await readFromFile("output.csv");
//
//   return roleList.result;
// }

export async function fetchAllRoles(headers: any) {
  let currentPage = 0;
  let roles: SupersetRole[] = [];

  const request = initRequest('GET', headers);

  while (true) {
    const queryParams = rison.encode({ page: currentPage, page_size: 100 });
    const roleList: RoleList = (await fetchRequest(
      `/security/roles?q=${queryParams}`,
      request,
    )) as RoleList;

    // Append roles from the current page to the allRoles array
    roles = roles.concat(roleList.result);

    // If there are no more roles on the current page, break out of the loop
    if (roleList.result.length === 0) {
      console.log(`Reached page ${currentPage}. No more roles to fetch.`);
      break;
    }

    // Increment the page value for the next request
    currentPage++;
  }

  await persistFetchedRoles(roles);
}

async function persistFetchedRoles(roles: SupersetRole[]) {
  await formatRoles(roles)
    .then((results) => {
      writeToCSV(results, 'output.csv');
      return results;
    })
    .then((results) => {
      saveRoles(results);
    })
    .catch((error) => {
      console.log(error);
    });
}

async function formatRoles(
  supersetRoles: SupersetRole[],
): Promise<ParsedRole[]> {
  const parsedRoles: ParsedRole[] = [];

  for (const role of supersetRoles) {
    const key = extractCHUCode(role.name);
    if (key) {
      console.log(key);
      parsedRoles.push({ code: key, role: role });
    }
  }

  return parsedRoles;
}

async function saveRoles(roles: ParsedRole[]) {
  const redisClient = getRedisClient();

  let isConnected = false;

  try {
    await redisClient.connect();
    redisClient.flushAll();
    isConnected = true;

    for (const role of roles) {
      await redisClient.hSet(role.code, 'role', JSON.stringify(role.role));
    }

    console.log(`${roles.length} Roles saved to Redis successfully.`);
  } catch (error) {
    console.error('Error saving roles to Redis:', error);
    throw error;
  } finally {
    if (isConnected) {
      disconnectRedis(redisClient);
    }
  }
}

async function disconnectRedis(redisClient: any) {
  try {
    await redisClient.disconnect();
    console.log('Redis client disconnected successfully.');
  } catch (disconnectError) {
    console.error('Error disconnecting Redis client:', disconnectError);
  }
}

function extractCHUCode(roleName: string): string | null {
  const chuCode = RegExp(/\d{6}/).exec(roleName); //match any 6 consecutive digits
  return chuCode ? chuCode[0] : null;
}

export function getCHUCodes(place: string): string[] {
  const chuCodes: string[] = [];

  if (place.includes(',')) {
    const places = place.split(',');

    places.forEach((place) => {
      place = place.trim();
      chuCodes.push(place);
    });
  }

  return chuCodes;
}

export function getCHARoles(
  array: SupersetRole[],
  place: string,
): SupersetRole[] {
  let roles: SupersetRole[] = [];

  console.log(place);

  if (place.includes(',')) {
    const places = place.split(',');

    places.forEach((place) => {
      place = place.trim();
      roles.push(...filterCHARoles(array, place));
    });
  } else {
    roles = filterCHARoles(array, place);
  }

  return roles;
}

function filterCHARoles(
  roles: SupersetRole[],
  searchString: string,
): SupersetRole[] {
  const escapedSearchString = escapeRegExp(searchString);
  const regexPattern = new RegExp(`^${escapedSearchString}_`, 'i');

  return roles.filter((supersetRole) => regexPattern.test(supersetRole.name));
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * This function should be run the first time the app is being set up to pull all the roles from superset.
 * Since we have to make successive calls of 100 roles each, this ensures we have a file with all the roles that can
 * be reused by anyone managing superset users.
 * @param parsedRole Role with a mapping of the 6 digit chu code and the JSON of the role for easier retrieval from Redis
 * @param filePath file that will contain the parsed roles.
 */
async function writeToCSV(parsedRole: ParsedRole[], filePath: string) {
  console.log(parsedRole);

  const fileExists = fs.existsSync(filePath);

  const header = 'code,role\n';

  const stream = fs.createWriteStream(filePath, {
    flags: fileExists ? 'a' : 'w',
  });

  // If the file is empty or does not exist, write the header
  if (!fileExists || fs.statSync(filePath).size === 0) {
    stream.write(header);
  }

  parsedRole.forEach((pRole) => {
    const { code, role } = pRole;
    stream.write(`${code},${JSON.stringify(role)}\n`);
  });

  stream.end();
}

/**
 * Read from CSV containing Superset roles. This file will be loaded to Redis for easier access.
 * @param filePath
 */
async function readFromFile(filePath: string) {
  const parsedRoles: ParsedRole[] = [];

  fs.createReadStream(filePath)
    .on('error', () => {
      throw new Error('File not found');
    })
    .pipe(csv())
    .on('data', (data: ParsedRole) => {
      parsedRoles.push(data);
    })
    .on('error', (error: Error) => {
      console.log(error.message);
    })
    .on('end', () => {
      console.log(parsedRoles);
      console.log(`Processed ${parsedRoles.length} successfully`);
    });
}

export async function updateRolePermissions(headers: any) {
  const redisClient = getRedisClient();
  const updatedRoles: number[] = [];
  const menuIds: MenuIds = {
    permission_view_menu_ids: chaPermissionList
  };

  let isConnected = false;

  try {
    await redisClient.connect();
    isConnected = true;

    const keys = await redisClient.keys('*');

    const BATCH_SIZE = 150;
    for (let i = 0; i < keys.length; i += BATCH_SIZE) {
      const batchKeys = keys.slice(i, i + BATCH_SIZE);
      const batchRoles = await Promise.all(batchKeys.map(async (key) => {
        const role = await redisClient.hGet(key, 'role');
        console.log(role);
        return parseRoleString(role);
      }));

      for (const parsedRole of batchRoles) {
        if (parsedRole) {
          await updatePermissions(parsedRole.id, headers, menuIds);
          updatedRoles.push(parsedRole.id);
        }
      }
    }
  } catch (error) {
    console.error('Error connecting to Redis:', error);
  } finally {
    if (isConnected) {
      await disconnectRedis(redisClient);
    }
  }

  return updatedRoles;
}

function getRedisClient() {
  const redisClient = createClient();
  redisClient.on('error', (err) => console.log('Redis Client Error', err));

  return redisClient;
}

function parseRoleString(
  roleString: string | undefined,
): SupersetRole | undefined {
  if (roleString) {
    // Type guard to ensure roleString is not undefined
    try {
      return JSON.parse(roleString);
    } catch (error) {
      console.error('Error parsing JSON string:', error);
      return undefined;
    }
  } else {
    console.error('jsonString is undefined');
    return undefined;
  }
}

