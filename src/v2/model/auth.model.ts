/**
 * Models for auth on Superset
 */

export interface LoginRequest {
  username: string;
  password: string;
  provider: string;
  refresh: boolean
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string
}

export interface CSRFResponse {
  result: string;
}
