import { fetchRequest, initRequest, postRequest } from './superset';

export interface RoleList {
  count: number;
  ids: number[];
  result: SupersetRole[];
}
export interface SupersetRole {
  id: number;
  name: string;
}

export const generateRole = (userType: string, placeCode: string) => ({
  name: `${userType}_${placeCode}`,
});

export const generatePermissions = (permissions: any) => ({
  permission_view_menu_ids: permissions,
});

export const getRoles = async (headers: any): Promise<SupersetRole[]> => {
  const request = initRequest('GET', headers);
  const roleList: RoleList = (await fetchRequest(
    '/security/roles/',
    request,
  )) as RoleList;

  console.log(`Found ${roleList.count} roles`);

  return roleList.result;
};

export const createUserRole = async (role: { name: string }, headers: any) => {
  const createdRole = await postRequest(
    headers,
    `/security/roles/`,
    JSON.stringify(role),
  );
  return { id: createdRole.id, name: createdRole.result.name };
};
