import fs from 'fs';
import csv from 'csv-parser';
import { SUPERSET, CHA_TABLES, DATA_FILE_PATH } from './config/config';

import {
  getBearerToken,
  getCSRFTokenAndCookie,
  getFormattedHeaders,
} from './utils/auth';

import { generateRole, generatePermissions } from './utils/role';

import { generateRowLevelSecurity } from './utils/rowlevelsecurity';
import { generateUser } from './utils/user';

import {
  postRequest,
  getPermissionsByRoleID,
  stringifyRequest,
  getRoles,
  getRequests,
} from './utils/superset';

import { resolveUrl } from './utils/url';
import { IRowLevelSecurity, IUser } from './utils/interface';

const DASHBOARD_VIEWER_ROLE_ID = 7;
const API_URL = resolveUrl(SUPERSET.baseURL, SUPERSET.apiPath);

const readAndParse = async (fileName: string) => {
  const BEARER_TOKEN = await getBearerToken(API_URL, {
    username: SUPERSET.username,
    password: SUPERSET.password,
    provider: 'db',
  });

  const [CSRF_TOKEN, COOKIE] = await getCSRFTokenAndCookie(
    API_URL,
    BEARER_TOKEN,
  );

  const AUTHORIZATION_HEADERS = getFormattedHeaders(
    BEARER_TOKEN,
    CSRF_TOKEN,
    COOKIE,
  );

  const dashboardViewerPermissions = await getPermissionsByRoleID(
    API_URL,
    AUTHORIZATION_HEADERS,
    DASHBOARD_VIEWER_ROLE_ID,
  );

  const PERMISSIONS = dashboardViewerPermissions.result.map(
    (item: { id: number }) => item.id,
  );

  const results: IUser[] = [];

  const { result: rolesAvailableOnSuperset } = await getRoles(
    API_URL,
    AUTHORIZATION_HEADERS,
  );

  const { result: rowLevelFromSuperset } = await getRequests(
    API_URL,
    AUTHORIZATION_HEADERS,
    `/rowlevelsecurity/`,
  );

  fs.createReadStream(fileName, 'utf-8')
    .on('error', () => {
      // handle error
    })
    .pipe(csv())
    .on('data', (data) => results.push(data))

    .on('end', async () => {
      for (const user of results) {
        let roleResult;
        const role = generateRole(user.role, user.place);
        const rolePermissions = generatePermissions(PERMISSIONS);

        const roleExists = rolesAvailableOnSuperset.find(
          (ssrole: { id: number; name: string }) => ssrole.name === role.name,
        );
        if (roleExists !== undefined) {
          roleResult = roleExists;
        } else {
          roleResult = await postRequest(
            API_URL,
            AUTHORIZATION_HEADERS,
            `/security/roles/`,
            stringifyRequest(role),
          );
          rolesAvailableOnSuperset.push({
            id: roleResult.id,
            name: roleResult.result.name,
          });
        }
        const createdRole = roleResult as { id: string };

        const rowLevelSecurity = generateRowLevelSecurity(
          [createdRole.id],
          user.group,
          user.place,
          CHA_TABLES,
          user.role,
        );
        await postRequest(
          API_URL,
          AUTHORIZATION_HEADERS,
          `/security/roles/${createdRole.id}/permissions`,
          stringifyRequest(rolePermissions),
        );
        const generatedUser = generateUser(user, [createdRole.id]);
        await postRequest(
          API_URL,
          AUTHORIZATION_HEADERS,
          `/security/users/`,
          stringifyRequest(generatedUser),
        );

        const doesRowLevelExist = rowLevelFromSuperset.some(
          (level: IRowLevelSecurity) => level.name === rowLevelSecurity.name,
        );
        if (!doesRowLevelExist) {
          const response = await postRequest(
            API_URL,
            AUTHORIZATION_HEADERS,
            `/rowlevelsecurity/`,
            stringifyRequest(rowLevelSecurity),
          );
          rowLevelFromSuperset.push(response.result);
        }
      }
    });
};

readAndParse(DATA_FILE_PATH);
