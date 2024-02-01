// const fetch = require('node-fetch')

// export const getFullUrl = (apiUrl: string, endpoint: string) => `${apiUrl}${endpoint}`

// export const initRequest = (method: string, authorizationHeaders: any): any => (
//   {
//     method: method,
//     headers: authorizationHeaders
//   }
// );

// export const mergeRequest = (baseObj: any, objToSync: any): any => {
//   return {
//     ...baseObj,
//     body: objToSync
//   };
// };

// export const fetchRequest = async (url: string, request: any) => {
//   const response = await fetch(url, request);
//   const data = await response.json();
//   return data;
// };

// export const postRequest = async (apiUrl: string, authorizationHeaders: any, endpoint: string, body: any) => {
//   const method = 'post';
//   const url = getFullUrl(apiUrl, endpoint);
//   const request = mergeRequest(initRequest(method, authorizationHeaders), body);
//   return await fetchRequest(url, request);
// };

// export const getPermissionsByRoleID = async (apiUrl: string, authorizationHeaders: any, roleID: number) => {
//   const method = 'get';
//   const endpoint = `/security/roles/${roleID}/permissions/`;
//   const url = getFullUrl(apiUrl, endpoint);
//   const request = initRequest(method, authorizationHeaders);
//   return await fetchRequest(url, request);
// };

// export const stringifyRequest = (request: any): any => JSON.stringify(request);


import fetch, { RequestInit } from 'node-fetch';

export const getFullUrl = (apiUrl: string, endpoint: string): string => `${apiUrl}${endpoint}`;

export const initRequest = (method: 'get' | 'post', authorizationHeaders: any): RequestInit => ({
  method,
  headers: authorizationHeaders
});

export const mergeRequest = (baseObj: RequestInit, objToSync: any): RequestInit => ({
  ...baseObj,
  body: JSON.stringify(objToSync)
});

export const fetchRequest = async (url: string, request: RequestInit): Promise<any> => {
  const response = await fetch(url, request);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.json();
};

export const postRequest = async (apiUrl: string, authorizationHeaders: any, endpoint: string, body: any): Promise<any> => {
  const method = 'post';
  const url = getFullUrl(apiUrl, endpoint);
  const request = mergeRequest(initRequest(method, authorizationHeaders), body);
  return await fetchRequest(url, request);
};

export const getPermissionsByRoleID = async (apiUrl: string, authorizationHeaders: any, roleID: number): Promise<any> => {
  const method = 'get';
  const endpoint = `/security/roles/${roleID}/permissions/`;
  const url = getFullUrl(apiUrl, endpoint);
  const request = initRequest(method, authorizationHeaders);
  return await fetchRequest(url, request);
};