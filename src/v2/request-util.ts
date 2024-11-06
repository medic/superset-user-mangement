/**
 * Helper functions for making network requests
 */

import fetch, { RequestInit, Headers } from "node-fetch";
import { SUPERSET } from "./config";

export const API_URL = (): string => {
  const url = new URL(SUPERSET.apiPath, SUPERSET.baseURL);
  return url.toString();
};

export async function fetchWithHeaders(
  endpoint: string,
  options: RequestInit,
): Promise<{ json: any; headers: Headers }> {
  try {
    const response = await fetch(endpoint, options);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const json = await response.json();
    return { json, headers: response.headers };
  } catch (error) {
    console.error('Fetching error:', error);
    throw error;
  }
}

export async function fetchRequest(
  endpoint: string,
  request: RequestInit,
): Promise<any> {
  const url = `${API_URL()}${endpoint}`;
  console.log(url);

  const response = await fetch(url, request);
  if (!response.ok) {
    console.log(
      `HTTP error! status: ${response.status} ${response.statusText}`,
    );
  }
  const res =  await response.json();
  console.log(res);
  return res;
}