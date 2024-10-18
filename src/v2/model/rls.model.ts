/**
 * Model for Row Level Security
 */

export interface RowLevelSecurity {
  clause: string;
  filter_type: string;
  group_key: string;
  name: string;
  roles: number[];
  tables: any[];
}

