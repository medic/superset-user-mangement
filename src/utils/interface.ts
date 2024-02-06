export interface IUser {
  first_name: string;
  last_name: string;
  active: boolean;
  email: string;
  roles: string;
  place: string;
  group: string;
  password: string;
}

export interface IRowLevelSecurity {
  clause: string;
  filter_type: string;
  group_key: string;
  name: string;
  roles: number[];
  tables: number[];
}
