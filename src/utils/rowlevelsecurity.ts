export const generateRowLevelSecurity = (
  roles: any,
  groupKey: string,
  placeCode: string,
  tables: any,
  userType: string,
) => ({
  clause: `${groupKey}='${placeCode}'`,
  filter_type: `Regular`,
  group_key: groupKey,
  name: `${userType}-${placeCode}`,
  roles: roles,
  tables: JSON.parse(tables),
});
