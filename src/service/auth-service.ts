import { LoginRequest } from '../types/auth';
import { SUPERSET } from '../config';
import { Logger } from '../utils/logger';
import { API_URL } from '../utils/request.utils';
import fetch from 'node-fetch';

/**
 * Class for handling authentication on Superset.
 * Provides methods to obtain bearer tokens, CSRF tokens, and formatted headers.
 * Headers are cached once obtained.
 */
export class AuthService {
  private static instance: AuthService;
  private headers: any;
  private refreshToken: string | null = null;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  public async login(): Promise<{ bearerToken: string; refreshToken: string }> {
    const body: LoginRequest = {
      username: SUPERSET.username,
      password: SUPERSET.password,
      provider: 'db',
      refresh: true
    };

    Logger.info(`Login request: ${JSON.stringify(body)}`);

    const url = `${API_URL()}/security/login`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    this.refreshToken = data.refresh_token;

    return {
      bearerToken: data.access_token,
      refreshToken: data.refresh_token,
    };
  }

  /**
   * Refresh the access token using the refresh token
   */
  public async refreshAccessToken(): Promise<string> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    if (this.isRefreshing) {
      // Return a promise that resolves when the token is refreshed
      return new Promise((resolve) => {
        this.refreshSubscribers.push(resolve);
      });
    }

    try {
      this.isRefreshing = true;
      Logger.info('Refreshing access token...');

      const url = `${SUPERSET.baseURL}${SUPERSET.apiPath}/security/refresh`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.refreshToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const newAccessToken = data.access_token;

      // Notify all subscribers about the new token
      this.refreshSubscribers.forEach(callback => callback(newAccessToken));
      this.refreshSubscribers = [];

      // Update headers with new token
      await this.updateHeaders(newAccessToken);

      Logger.success('Successfully refreshed access token');
      return newAccessToken;
    } catch (error) {
      Logger.error('Failed to refresh token, initiating new login');
      // If refresh fails, clear everything and login again
      this.headers = null;
      this.refreshToken = null;
      this.refreshSubscribers = [];
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  private async updateHeaders(accessToken: string): Promise<void> {
    const csrf = await this.getCSRFToken(accessToken);
    this.headers = this.getFormattedHeaders(
      accessToken,
      csrf.token,
      csrf.cookie
    );
  }

  private readonly getCSRFToken = async (bearerToken: string): Promise<{ token: string; cookie: string }> => {
    const response = await fetch(`${SUPERSET.baseURL}${SUPERSET.apiPath}/security/csrf_token/`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        'X-Request-With': 'XMLHttpRequest'
      },
    });

    if (!response.ok) {
      throw new Error(`CSRF token fetch failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const csrfCookie = response.headers.get('set-cookie') || '';
    
    return {
      token: data.result,
      cookie: csrfCookie
    };
  };

  private readonly getFormattedHeaders = (
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
    // Check if headers are already cached
    if (this.headers) {
      Logger.info('Using cached headers');
      return this.headers;
    }

    try {
      // Fetch new tokens
      Logger.info('Fetching new headers');
      const { bearerToken } = await this.login();
      await this.updateHeaders(bearerToken);
      Logger.success('Successfully fetched headers');
      
      return this.headers;
    } catch (error) {
      Logger.error(`Error during getHeaders:, ${error}`);
      throw error;
    }
  }
}
