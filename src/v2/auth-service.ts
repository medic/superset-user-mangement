/**
 * Authentication helper functions
 */

import { LoginRequest, LoginResponse, CSRFResponse } from './auth.model';
import { SUPERSET } from './config';
import fetch, { Headers, RequestInit } from 'node-fetch';

export class AuthService {
  private headers: any;

  private getApiUrl = (): string => {
    const url = new URL(SUPERSET.apiPath, SUPERSET.baseURL);
    return url.toString();
  };

  public async login(): Promise<{ bearerToken: string; cookie: string }> {
    const body: LoginRequest = {
      username: SUPERSET.username,
      password: SUPERSET.password,
      provider: 'db',
    };

    const { json, headers }: { json: LoginResponse; headers: Headers } =
      await this.fetchWithHeaders(`${this.getApiUrl()}/security/login`, {
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

    const data: CSRFResponse = await this.fetchWithHeaders(
      `${this.getApiUrl()}/security/csrf_token/`,
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

  private async fetchWithHeaders(
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

  public async fetchRequest(
    endpoint: string,
    request: RequestInit,
  ): Promise<any> {
    const url = `${this.getApiUrl()}${endpoint}`;
    console.log(url);

    const response = await fetch(url, request);
    if (!response.ok) {
      console.log(
        `HTTP error! status: ${response.status} ${response.statusText}`,
      );
    }
    return await response.json();
  }
}
