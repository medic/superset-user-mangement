/**
 * Role related types
 */

export interface RoleList {
  count: number;
  ids: number[];
  result: SupersetRole[];
}

export interface SupersetRole {
  id: number;
  name: string;
}

export interface CreateRoleResponse {
  id: string;
  result: {
    name: string;
  };
  name: string;
}

export interface ParsedRole {
  code: string;
  role: SupersetRole;
}
