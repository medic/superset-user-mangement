import { fetchRequest, getPermissionsByRoleID, initRequest } from "./superset";
import collect from "collect.js";

interface RoleList {
  count: number,
  ids: number[],
  result: SupersetRole[];
}
export interface SupersetRole {
  id: number;
  name: string;
}

// TODO explore if this is the format to be used when creating a role. 
// Current implementation uses {chuCode_chuName} format
export const generateRole = (userType: string, placeCode: number) => ({
  name: `${userType}_${placeCode}`
});

export const generatePermissions = (permissions: any) => ({
  permission_view_menu_ids: permissions
});

export const getRoles = async (headers: any): Promise<SupersetRole[]> => {
  const request = initRequest('GET', headers);
  const roleList: RoleList = await fetchRequest("/security/roles/", request) as RoleList;

  return roleList.result;
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
  const regexPattern = new RegExp(`^${searchString}_`);
  return roles.filter(supersetRole => regexPattern.test(supersetRole.name));
}
