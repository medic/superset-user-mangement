/**
 * User related types
 */

import { SupersetRole } from "../role";

export interface User {
  active: boolean;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  password: string;
  roles: number[];
}

export interface SupersetUser {
  id: number;
  active: boolean;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  roles: SupersetRole[];
  login_count: number;
  created_on: string;
  changed_on: string;
}

export interface CHAUser {
  first_name: string;
  last_name: string;
  username: string;
  password: string;
  email: string;
  role: string;
  chu: string;
  county: string;
  facility: string;
}

export interface CreateUserResponse {
  result: User
}