import { LoginRequest } from '../model/auth.model';
import { SUPERSET } from '../config';
import { makeApiRequest } from '../request-util';

/**
 * Class for handling authentication on Superset.
 * Provides methods to obtain bearer tokens, CSRF tokens, and formatted headers.
 * Headers are cached once obtained.
 */
export class AuthService {
  private headers: any;

  public async login(): Promise<{ bearerToken: string }> {
    const body: LoginRequest = {
      username: SUPERSET.username,
      password: SUPERSET.password,
      provider: 'db',
      refresh: true
    };

    const response = await makeApiRequest(
      `/security/login`,
      {
        method: 'post',
        data: body,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    return {
      bearerToken: response.data.access_token,
    };
  }

  private readonly getCSRFToken = async (bearerToken: string): Promise<{ token: string; cookie: string }> => {
    const response = await makeApiRequest(
      `/security/csrf_token/`,
      {
        method: 'get',
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          'X-Request-With': 'XMLHttpRequest'
        },
      }
    );

    const csrfCookie = response.headers?.['set-cookie']?.[0] ?? '';
    
    return {
      token: response.data.result,
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
      return this.headers;
    }

    try {
      // Fetch new tokens
      const { bearerToken } = await this.login();
      const csrf = await this.getCSRFToken(bearerToken);

      // Set headers once obtained
      this.headers = this.getFormattedHeaders(
        bearerToken, 
        csrf.token,
        csrf.cookie
      );
      console.log('Final headers:', this.headers);

      return this.headers;
    } catch (error) {
      console.error('Error during getHeaders:', error);
      throw error;
    }
  }
}
