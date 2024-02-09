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
export interface IRowLevelSecurityFromSuperset {
  changed_on_delta_humanized: 'string';
  clause: 'string';
  description: 'string';
  filter_type: 'Regular';
  group_key: 'string';
  id: 0;
  name: 'string';
  roles: [
    {
      id: 0;
      name: 'string';
    },
  ];
  tables: [
    {
      id: 0;
      schema: 'string';
      table_name: 'string';
    },
  ];
}
export interface IHeaders {
  Authorization: string;
  'Content-Type': string;
  'X-CSRFToken': string;
  Cookie: string;
}
