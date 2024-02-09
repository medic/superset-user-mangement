import { SUPERSET } from '../config/config';
import fetch, { Headers, RequestInit } from 'node-fetch';
import { resolveUrl } from './url';

export const API_URL = resolveUrl(SUPERSET.baseURL, SUPERSET.apiPath);

interface LoginRequest {
  username: string;
  password: string;
  provider: string;
}

interface LoginResponse {
  access_token: string;
}

interface CSRFResponse {
  result: string;
}
// Helper function to handle fetch requests and return both json and headers
async function fetchFromAPI(
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

export const loginResult = async (): Promise<{
  bearerToken: string;
  cookie: string;
}> => {
  const body: LoginRequest = {
    username: SUPERSET.username,
    password: SUPERSET.password,
    provider: 'db',
  };

  const { json, headers }: { json: LoginResponse; headers: Headers } =
    await fetchFromAPI(`${API_URL}/security/login`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

  const cookie = headers.get('Set-Cookie') || '';
  return { bearerToken: json.access_token, cookie };
};

export const getCSRFToken = async (bearerToken: string): Promise<string> => {
  const headers = {
    Authorization: `Bearer ${bearerToken}`,
  };

  const data: CSRFResponse = await fetchFromAPI(
    `${API_URL}/security/csrf_token/`,
    {
      method: 'GET',
      headers: headers,
    },
  ).then((res) => res.json);

  return data.result;
};

export const getFormattedHeaders = (
  bearerToken: string,
  csrfToken: string,
  cookie: string,
) => ({
  Authorization: `Bearer ${bearerToken}`,
  'Content-Type': 'application/json',
  'X-CSRFToken': csrfToken,
  Cookie: cookie,
});
