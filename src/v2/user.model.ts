/**
 * Models for users
 */

export interface User {
  active: boolean;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  password: string;
  roles: number[];
}

export interface CSVUser {
  first_name: string,
  last_name: string,
  username: string,
  email: string,
  role: string,
  chu: string,
  password: string
}