/**
 * User related types
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
