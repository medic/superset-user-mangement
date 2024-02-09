import {
  IHeaders,
  IRowLevelSecurity,
  IRowLevelSecurityFromSuperset,
} from './interface';
import { fetchRequest, initRequest, postRequest } from './superset';

export const generateRowLevelSecurity = (
  roles: number[],
  groupKey: string,
  placeCode: string,
  tables: string,
  userType: string,
) => ({
  clause: `${groupKey}='${placeCode}'`,
  filter_type: `Regular`,
  group_key: groupKey,
  name: `${userType}-${placeCode}`,
  roles: roles,
  tables: JSON.parse(tables),
});

export const getAvailableRowlevelSecurityFromSuperset = async (
  authorizationHeaders: IHeaders,
): Promise<{ result: IRowLevelSecurityFromSuperset[] }> => {
  const method = 'GET';
  const endpoint = `/rowlevelsecurity/`;
  const request = initRequest(method, authorizationHeaders);
  return await fetchRequest(endpoint, request);
};

export const createRowlevelSecurity = async (
  rowlevelsecurity: IRowLevelSecurity,
  headers: IHeaders,
) => {
  return await postRequest(
    headers,
    `/rowlevelsecurity/`,
    JSON.stringify(rowlevelsecurity),
  );
};
