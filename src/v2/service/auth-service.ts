/**
 * Authentication helper functions
 */

import { LoginRequest, LoginResponse, CSRFResponse } from '../model/auth.model';
import { SUPERSET } from '../config';
import { Headers } from 'node-fetch';
import { API_URL, fetchWithHeaders } from '../request-util';

export class AuthService {
  private headers: any;

  public async login(): Promise<{ bearerToken: string; cookie: string }> {
    const body: LoginRequest = {
      username: SUPERSET.username,
      password: SUPERSET.password,
      provider: 'db',
      refresh: true
    };

    const { json, headers }: { json: LoginResponse; headers: Headers } =
      await fetchWithHeaders(`${API_URL()}/security/login`, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      });

    const cookie = headers.get('Set-Cookie') ?? '';
    return { bearerToken: json.access_token, cookie };
  }

  private readonly getCSRFToken = async (bearerToken: string): Promise<string> => {
    const headers = {
      Authorization: `Bearer ${bearerToken}`,
    };

    const data: CSRFResponse = await fetchWithHeaders(
      `${API_URL()}/security/csrf_token/`,
      {
        method: 'GET',
        headers: headers,
      },
    ).then((res) => res.json);

    return data.result;
  };

  private readonly getFormattedHeaders = (
    bearerToken: string,
    csrfToken: string,
  ) => ({
    Authorization: `Bearer ${bearerToken}`,
    'Content-Type': 'application/json',
    'X-CSRFToken': csrfToken,
  });

  public async getHeaders() {
    // Check if headers are already cached
    if (this.headers) {
      return this.headers;
    }

    try {
      // Fetch new tokens
      const tokens = await this.login();
      const csrfToken = await this.getCSRFToken(tokens.bearerToken);

      // Set headers once obtained
      this.headers = this.getFormattedHeaders(tokens.bearerToken, csrfToken);

      return this.headers;
    } catch (error) {
      console.error('Error during getHeaders:', error);
      throw error;
    }
  }
}
