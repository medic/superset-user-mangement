import { SUPERSET } from '../config/config';

import fetch from 'node-fetch';
import { resolveUrl } from './url';

const API_URL = resolveUrl(SUPERSET.baseURL, SUPERSET.apiPath);

interface LoginRequest {
  username: string;
  password: string;
  provider: string
}

interface LoginResponse {
  access_token: string;
}

export const getBearerToken = async () => {
  const body: LoginRequest = {
    username: SUPERSET.username,
    password: SUPERSET.password,
    provider: "db"
  };

  const response = await fetch(`${API_URL}/security/login`, {
    method: 'post',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' }
  });

  const data = await response.json() as LoginResponse;
  return data.access_token;
};

export const getCSRFToken = async (bearerToken: string) => {
  const headers = {
    Authorization: `Bearer ${bearerToken}`
  };
  const response = await fetch(`${API_URL}/security/csrf_token/`, {
    method: 'get',
    headers: headers
  });
  const data = await response.json() as { result: string };
  return data.result;
}

// To-Do: Implement this to get cookie - required for row-level-security to work
export const getCookie = async () => {
  return 'session=';
};

export const getFormattedHeaders = (bearerToken: string, csrfToken: string, cookie: string) => ({
  'Authorization': `Bearer ${bearerToken}`,
  'Content-Type': 'application/json',
  'X-CSRFToken': csrfToken,
  'Cookie': cookie
});
