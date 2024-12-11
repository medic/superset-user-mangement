import { LoginRequest } from '../types/auth';
import { SUPERSET } from '../config';
import { Logger } from '../utils/logger';
import { API_URL } from '../utils/request.utils';
import fetch from 'node-fetch';
import { RedisService } from '../repository/redis-util';

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
  private isLoggingIn = false;
  private loginSubscribers: Array<(headers: any) => void> = [];
  private readonly HEADERS_CACHE_KEY = 'superset:headers';
  private readonly HEADERS_CACHE_TIMEOUT = 600; // 10 minutes in seconds

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  public async login(): Promise<{ bearerToken: string; refreshToken: string }> {
    if (this.isLoggingIn) {
      // Return a promise that resolves when the login is complete
      return new Promise((resolve) => {
        this.loginSubscribers.push((headers) => {
          resolve({ 
            bearerToken: headers.Authorization.split(' ')[1],
            refreshToken: this.refreshToken!
          });
        });
      });
    }

    try {
      this.isLoggingIn = true;
      const body: LoginRequest = {
        username: SUPERSET.username,
        password: SUPERSET.password,
        provider: 'db',
        refresh: true
      };

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

      // Update headers before notifying subscribers
      await this.updateHeaders(data.access_token);

      // Notify all subscribers about the successful login
      this.loginSubscribers.forEach(callback => callback(this.headers));
      this.loginSubscribers = [];

      return {
        bearerToken: data.access_token,
        refreshToken: data.refresh_token,
      };
    } finally {
      this.isLoggingIn = false;
    }
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

      const url = `${API_URL()}/security/refresh`;
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

    // Cache headers in Redis
    const redisClient = await RedisService.getClient();
    await redisClient.set(this.HEADERS_CACHE_KEY, JSON.stringify(this.headers), {
      EX: this.HEADERS_CACHE_TIMEOUT
    });
  }

  private readonly getCSRFToken = async (bearerToken: string): Promise<{ token: string; cookie: string }> => {
    const response = await fetch(`${API_URL()}/security/csrf_token/`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${bearerToken}`
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

  public async getHeaders(): Promise<Record<string, string>> {
    try {
      // Try to get headers from Redis cache first
      const redisClient = await RedisService.getClient();
      const cachedHeaders = await redisClient.get(this.HEADERS_CACHE_KEY);
      
      if (cachedHeaders) {
        this.headers = JSON.parse(cachedHeaders);
        return this.headers;
      }

      // If no cached headers, fetch new ones
      Logger.info('No cached headers found, fetching new ones');
      const { bearerToken } = await this.login();
      await this.updateHeaders(bearerToken);
      Logger.success('Successfully fetched and cached new headers');
      
      return this.headers;
    } catch (error) {
      Logger.error(`Error during getHeaders: ${error}`);
      
      // If we get a 401 error, clear cache and retry login
      if (error instanceof Error && error.message.includes('401')) {
        Logger.info('Received 401, clearing cache and retrying login');
        const redisClient = await RedisService.getClient();
        await redisClient.del(this.HEADERS_CACHE_KEY);
        this.headers = null;
        return this.getHeaders();
      }
      
      throw error;
    }
  }
}
