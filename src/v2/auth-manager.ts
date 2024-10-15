/**
 * Authentication helper functions
 */

import { LoginRequest, LoginResponse, CSRFResponse } from "./auth.model";
import { SUPERSET } from "./config";
import fetch, { Headers, RequestInit } from 'node-fetch';

export class AuthManager {

  private static API_URL = (): string => {
    const url = new URL(SUPERSET.baseURL, SUPERSET.apiPath);
    return url.toString()
  }

  public async login(): Promise<{ bearerToken: string, cookie: string }> {
    const body: LoginRequest = {
      username: SUPERSET.username,
      password: SUPERSET.password,
      provider: "db"
    };
  
    const { json, headers }: { json: LoginResponse, headers: Headers } = await this.fetchWithHeaders(`${AuthManager.API_URL}/security/login`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' }
    });
  
    const cookie = headers.get('Set-Cookie') ?? '';
    return { bearerToken: json.access_token, cookie };
  };

  private getCSRFToken = async (bearerToken: string): Promise<string> => {
    const headers = {
      'Authorization': `Bearer ${bearerToken}`
    };
  
    const data: CSRFResponse = await this.fetchWithHeaders(`${AuthManager.API_URL}/security/csrf_token/`, {
      method: 'GET',
      headers: headers
    }).then(res => res.json);
  
    return data.result;
  };

  private getFormattedHeaders = (bearerToken: string, csrfToken: string, cookie: string) => ({
    'Authorization': `Bearer ${bearerToken}`,
    'Content-Type': 'application/json',
    'X-CSRFToken': csrfToken,
    'Cookie': cookie
  });

  public async getHeaders(): Promise<Record<string, string>> {
    const tokens = await this.login();
    const csrfToken = await this.getCSRFToken(tokens.bearerToken);

    return this.getFormattedHeaders(tokens.bearerToken, csrfToken, tokens.cookie);
  }

  private async fetchWithHeaders(endpoint: string, options: RequestInit): Promise<{ json: any, headers: Headers }> {
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

  public async fetchRequest(endpoint: string, request: RequestInit): Promise<any> {
    const url = `${AuthManager.API_URL()}${endpoint}`;
    console.log(url);

    const response = await fetch(url, request);
    if (!response.ok) {
      console.log(`HTTP error! status: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  }
}