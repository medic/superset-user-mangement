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

  private getCSRFToken = async (bearerToken: string): Promise<string> => {
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

  private getFormattedHeaders = (
    bearerToken: string,
    csrfToken: string,
    cookie: string,
  ) => ({
    Authorization: `Bearer ${bearerToken}`,
    'Content-Type': 'application/json',
    'X-CSRFToken': csrfToken,
    Cookie: cookie,
  });

  public async getHeaders() {
    if (!this.headers) {
      try {
        const tokens = await this.login();
        console.log(`Login successful`);

        const csrfToken = await this.getCSRFToken(tokens.bearerToken);

        this.headers = this.getFormattedHeaders(
          tokens.bearerToken,
          csrfToken,
          tokens.cookie,
        );
        return this.headers;
      } catch (error) {
        console.error('Error during getHeaders:', error);
        throw error;
      }
    } else {
      return this.headers; // Return cached headers if already set
    }
  }
}
