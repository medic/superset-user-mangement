const fetch = require('node-fetch');

export const getFullUrl = (apiUrl: string, endpoint: string) =>
  `${apiUrl}${endpoint}`;

export const initRequest = (
  method: string,
  authorizationHeaders: any,
): any => ({
  method: method,
  headers: authorizationHeaders,
});

export const mergeRequest = (baseObj: any, objToSync: any): any => {
  return {
    ...baseObj,
    body: objToSync,
  };
};

export const fetchRequest = async (url: string, request: any) => {
  const response = await fetch(url, request);
  const data = await response.json();
  return data;
};

export const postRequest = async (
  apiUrl: string,
  authorizationHeaders: any,
  endpoint: string,
  body: any,
) => {
  const method = 'post';
  const url = getFullUrl(apiUrl, endpoint);
  const request = mergeRequest(initRequest(method, authorizationHeaders), body);
  return await fetchRequest(url, request);
};

export const getPermissionsByRoleID = async (
  apiUrl: string,
  authorizationHeaders: any,
  roleID: number,
) => {
  const method = 'get';
  const endpoint = `/security/roles/${roleID}/permissions/`;
  const url = getFullUrl(apiUrl, endpoint);
  const request = initRequest(method, authorizationHeaders);
  return await fetchRequest(url, request);
};

export const getRoles = async (apiUrl: string, authorizationHeaders: any) => {
  const method = 'get';
  const endpoint = `/security/roles/`;
  const url = getFullUrl(apiUrl, endpoint);
  const request = initRequest(method, authorizationHeaders);
  return await fetchRequest(url, request);
};

export const getRequests = async (
  apiUrl: string,
  authorizationHeaders: any,
  endpoint: string,
) => {
  const method = 'get';
  const url = getFullUrl(apiUrl, endpoint);
  const request = initRequest(method, authorizationHeaders);
  return await fetchRequest(url, request);
};

export const stringifyRequest = (request: any): any => JSON.stringify(request);
