import { fetchRequest, initRequest } from "./superset";
import { createClient} from "redis";
import rison from "rison";

interface RoleList {
  count: number,
  ids: number[],
  result: SupersetRole[];
}

export interface SupersetRole {
  id: number;
  name: string;
}

export const getRoles = async (headers: any): Promise<SupersetRole[]> => {
  const request = initRequest('GET', headers);

  const queryParams = rison.encode({"page": 0, "page_size": 100});
  const roleList: RoleList = await fetchRequest(`/security/roles?q=${queryParams}`, request) as RoleList;

  await saveRoles(roleList.result)

  return roleList.result;
}

async function saveRoles(roles: SupersetRole[]) {
  const redisClient = createClient()
  redisClient.on('error', (err) => console.log('Redis Client Error', err));

  await redisClient.connect();

  for (const role of roles) {
    const key = extractCHUCode(role.name);
    if (key) {
      console.log(key);
      await redisClient.hSet(key, 'role', JSON.stringify(role));
    }
  }

  await redisClient.disconnect();
}

function extractCHUCode(roleName: string): string | null  {
  const chuCode = RegExp(/\d{6}/).exec(roleName); //match any 6 consecutive digits
  return chuCode ? chuCode[0] : null;
}

export function getCHARoles(array: SupersetRole[], place: string): SupersetRole[] {
  let roles: SupersetRole[] = [];

  console.log(place);

  if (place.includes(',')) {
    const places = place.split(',');

    places.forEach(place => {
      place = place.trim();
      roles.push(...filterCHARoles(array, place))
    })
  }
  else {
    roles = filterCHARoles(array, place);
  }

  return roles;
}

function filterCHARoles(roles: SupersetRole[], searchString: string): SupersetRole[] {
  const escapedSearchString = escapeRegExp(searchString);
  const regexPattern = new RegExp(`^${escapedSearchString}_`, 'i');

  return roles.filter(supersetRole => regexPattern.test(supersetRole.name));
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
