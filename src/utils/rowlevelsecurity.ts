export const generateRowLevelSecurity = (roles: any, groupKey: string, placeCode: number, tables: any) => (
  {
    clause: `${groupKey}='${placeCode}'`,
    filter_type: `Regular`,
    group_key: groupKey,
    name: `cha-${placeCode}`,
    roles: roles,
    tables: JSON.parse(tables)
  }
);

interface RowLevelSecurity {
  clause: string;
  filter_type: string;
  group_key: string;
  name: string;
  roles: any[];
  tables: any[];
}

export const generateRLS = (roles: any[], groupKey: string, placeCode: number, tables: any[]): RowLevelSecurity => {
  if (!Array.isArray(roles) || !Array.isArray(tables)) {
    throw new Error('Roles and tables must be arrays');
  }

  return {
    clause: `${groupKey}='${placeCode}'`,
    filter_type: `Regular`,
    group_key: groupKey,
    name: `cha-${placeCode}`,
    roles,
    tables
  };
};