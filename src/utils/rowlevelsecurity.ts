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
