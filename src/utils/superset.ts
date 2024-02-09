import fetch, { RequestInit } from 'node-fetch';
import { API_URL } from './auth';
import { IHeaders } from './interface';

export const initRequest = (
  method: 'GET' | 'POST',
  authorizationHeaders: any,
): RequestInit => ({
  method,
  headers: authorizationHeaders,
});

export const mergeRequest = (
  baseObj: RequestInit,
  objToSync: any,
): RequestInit => ({
  ...baseObj,
  body: JSON.stringify(objToSync),
});

export const fetchRequest = async (
  endpoint: string,
  request: RequestInit,
): Promise<any> => {
  const url = `${API_URL}${endpoint}`;
  console.log(url);

  const response = await fetch(url, request);
  if (!response.ok) {
    // throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
    console.log(
      `HTTP error! status: ${response.status} ${response.statusText}`,
    );
  }
  return await response.json();
};

export const postRequest = async (
  authorizationHeaders: IHeaders,
  endpoint: string,
  body: any,
): Promise<any> => {
  const method = 'POST';
  const request = mergeRequest(initRequest(method, authorizationHeaders), body);
  return await fetchRequest(endpoint, request);
};

export const getPermissionsByRoleID = async (
  authorizationHeaders: IHeaders,
  roleID: number,
): Promise<{
  result: { id: number; permission_name: string; view_menu_name: string }[];
}> => {
  const method = 'GET';
  const endpoint = `/security/roles/${roleID}/permissions/`;
  const request = initRequest(method, authorizationHeaders);
  return await fetchRequest(endpoint, request);
};
