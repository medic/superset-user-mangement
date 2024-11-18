/**
 * Authentication helper functions
 */

import { LoginRequest, LoginResponse, CSRFResponse } from '../model/auth.model';
import { SUPERSET } from '../config';
import { API_URL } from '../request-util';
import axios from 'axios';

export class AuthService {
  private headers: any;

  public async login(): Promise<{ bearerToken: string; cookie: string }> {
    const body: LoginRequest = {
      username: SUPERSET.username,
      password: SUPERSET.password,
      provider: 'db',
      refresh: true
    };

    const response = await axios.post(`${API_URL()}/security/login`, body, {
      headers: { 'Content-Type': 'application/json' },
    });

    const cookie = response.headers['set-cookie']?.[0] ?? '';
    console.log('Login response cookie:', cookie);
    
    return { 
      bearerToken: response.data.access_token,
      cookie 
    };
  }

  private readonly getCSRFToken = async (bearerToken: string): Promise<string> => {
    const response = await axios.get(`${API_URL()}/security/csrf_token/`, {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        'X-Request-With': 'XMLHttpRequest'
      },
    });

    console.log('CSRF token response:', response.data);
    return response.data.result;
  };

  private readonly getFormattedHeaders = (
    bearerToken: string,
    csrfToken: string,
    cookie: string,
  ) => ({
    Authorization: `Bearer ${bearerToken}`,
    'Content-Type': 'application/json',
    'X-CSRFToken': csrfToken,
    'X-Request-With': 'XMLHttpRequest',
    Cookie: cookie,
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
      this.headers = this.getFormattedHeaders(tokens.bearerToken, csrfToken, tokens.cookie);
      console.log('Final headers:', this.headers);

      return this.headers;
    } catch (error) {
      console.error('Error during getHeaders:', error);
      throw error;
    }
  }
}
