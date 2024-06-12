import fetch, { RequestInit } from 'node-fetch';
import { API_URL } from './auth';

export const initRequest = (method: 'GET' | 'POST', authorizationHeaders: any): RequestInit => ({
  method,
  headers: authorizationHeaders
});

export const mergeRequest = (baseObj: RequestInit, objToSync: any): RequestInit => ({
  ...baseObj,
  body: JSON.stringify(objToSync)
});

export const fetchRequest = async (endpoint: string, request: RequestInit): Promise<any> => {
  const url = `${API_URL}${endpoint}`
  console.log(url)

  const response = await fetch(url, request);
  if (!response.ok) {
    console.log(`HTTP error! status: ${response.status} ${response.statusText}`);
  }
  return await response.json();
};

export const postRequest = async (authorizationHeaders: any, endpoint: string, body: any): Promise<any> => {
  const method = 'POST';
  const request = mergeRequest(initRequest(method, authorizationHeaders), body);
  return await fetchRequest(endpoint, request);
};

