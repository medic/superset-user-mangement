/**
 * Model for Row Level Security
 */
import {SupersetRole} from "./role.model";

export interface RLSList {
  count: number;
  ids: number[];
  result: RowLevelSecurity[]
}

export interface RowLevelSecurity {
  id: number;
  clause: string;
  filter_type: string;
  group_key: string;
  description: string;
  name: string;
  roles: SupersetRole[];
  tables: Table[];
}

export interface Table {
  id: number;
  schema: string;
  table_name: string;
}

export interface RLSEntity {
  id: number;
  rls: RowLevelSecurity;
}

export interface UpdateRLSRequest {
  clause: string;
  description: string;
  filter_type: string;
  group_key: string;
  name: string;
  roles: number[];
  tables: number[];
}

export interface UpdateRLSResponse {
  id: number;
  result: UpdateRLSRequest;
}

export interface UpdateResult {
  id: number;
  status: string;
  message: string;
}
