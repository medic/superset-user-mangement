import { fetchRequest, initRequest } from "./superset";

interface RoleList {
  count: number,
  ids: number[],
  result: SupersetRole[];
}
interface SupersetRole {
  id: number;
  name: string;
}

export const generateRole = (userType: string, placeCode: number) => ({
  name: `${userType}_${placeCode}`
});

export const generatePermissions = (permissions: any) => ({
  permission_view_menu_ids: permissions
});

// export const getDashboardViewerPermissions = async (url: string, headers: any, roleID: number) => {
//   const dashboardViewerPermissions = await getPermissionsByRoleID(url, headers, roleID);
//   return dashboardViewerPermissions.result.map((item: { id: number; }) => item.id);
// }

export const getRoles = async (headers: any): Promise<SupersetRole[]> => {
  const request = initRequest('GET', headers);
  const roleList: RoleList = await fetchRequest("/security/roles/", request) as RoleList;

  console.log(`Found ${roleList.count} roles`)

  return roleList.result;
}

export function filterRoles(array: SupersetRole[], searchString: string): SupersetRole[] {
  const regexPattern = new RegExp(`^${searchString}_`);
  return array.filter(supersetRole => regexPattern.test(supersetRole.name));
}
