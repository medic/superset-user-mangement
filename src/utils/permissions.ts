import fetch from "node-fetch";
import {fetchRequest, initRequest, postRequest} from "./superset";

type PermissionList = {
  result: Permission[]
}

type Permission = {
  id: number,
  permission_name: string,
  view_menu_name: string
}

type UpdateResult = {
  result: MenuIds;
}

export type MenuIds = {
  permission_view_menu_ids: number[];
}

export async function getPermissionsByRoleId(authorizationHeaders: any, roleID: number): Promise<PermissionList> {
  const method = "GET";
  const endpoint = `/security/roles/${roleID}/permissions/`;
  const request = initRequest(method, authorizationHeaders);
  return await fetchRequest(endpoint, request) as PermissionList;
}

export async function updatePermissions(roleId: number, headers: any, menuIds: MenuIds): Promise<UpdateResult> {
  return await postRequest(headers, `/security/roles/${roleId}/permissions`, menuIds) as UpdateResult;
}

export const chaPermissionList = [
  3, 7, 9, 11, 15, 22, 23, 30, 32, 41, 42, 43, 44, 45, 46, 47, 48, 50, 52, 53, 55, 62, 63, 65, 67, 69, 70, 71, 78, 82, 83, 88, 90, 91, 92, 99, 102, 103, 104, 105, 107, 108, 109, 110, 111, 112, 113, 114, 115, 118, 119, 120, 121, 122, 123, 125, 126, 127, 128, 130, 131, 134, 135, 136, 138, 140, 141, 142, 144, 145, 147, 148, 151, 162, 163, 164, 165, 166, 167, 169, 171, 178, 183, 185, 186, 187, 188, 192, 194, 201, 202, 206, 207, 263, 266, 295, 296, 297, 350
];
