/**
 * Model for roles stored in Redis.
 */
export interface ParsedRole {
  code: string;
  role: SupersetRole;
}

/**
 * List of roles as fetched from Superset
 */
export interface RoleList {
  count: number;
  ids: number[];
  result: SupersetRole[];
}

/**
 * Model for a Superset Role
 */
export interface SupersetRole {
  id: number;
  name: string;
}