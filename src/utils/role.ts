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
  try {
    const { id, result } = await postRequest(
      headers,
      `/security/roles/`,
      JSON.stringify(role),
    );
    return { id, name: result.name };
  } catch (error) {
    // Handle the error here
    console.error('Error creating role:', error);
    throw new Error('Failed to create role');
  }
};
