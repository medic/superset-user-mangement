import { fetchRequest, getPermissionsByRoleID, initRequest } from "./superset";

interface RoleList {
  count: number,
  ids: number[],
  result: SupersetRole[];
}
export interface SupersetRole {
  id: number;
  name: string;
}

export const generateRole = (userType: string, placeCode: number) => ({
  name: `${userType}_${placeCode}`
});

export const generatePermissions = (permissions: any) => ({
  permission_view_menu_ids: permissions
});

export const getRoles = async (headers: any): Promise<SupersetRole[]> => {
  const request = initRequest('GET', headers);
  const roleList: RoleList = await fetchRequest("/security/roles/", request) as RoleList;

  console.log(`Found ${roleList.count} roles`)

  return roleList.result;
}

export function getUserRoles(array: SupersetRole[], place: string): SupersetRole[] {
  let roles: SupersetRole[] = [];

  if (place.includes(',')) {
    const places = place.split(',');

    places.forEach(place => {
      place = place.trim();
      roles.push(...filterRoles(array, place))
    })
  }
  else {
    roles = filterRoles(array, place);
  }

  return roles;
}

function filterRoles(array: SupersetRole[], searchString: string): SupersetRole[] {
  const regexPattern = new RegExp(`^${searchString}_`);
  return array.filter(supersetRole => regexPattern.test(supersetRole.name));
}
