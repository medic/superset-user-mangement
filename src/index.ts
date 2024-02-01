import fs from 'fs';
import csv from 'csv-parser';

import {
  SUPERSET,
  CHA_TABLES,
  DATA_FILE_PATH
} from './config/config';

import {
  getBearerToken,
  getCSRFToken,
  getCookie,
  getFormattedHeaders
} from './utils/auth';

import {
  generateRole,
  generatePermissions
} from './utils/role';

import { generateRowLevelSecurity } from './utils/rowlevelsecurity';
import { generateUser } from './utils/user';

import {
  postRequest,
  getPermissionsByRoleID,
  stringifyRequest
} from './utils/superset';

import { resolveUrl } from './utils/url';

const DASHBOARD_VIEWER_ROLE_ID = 4; // TODO replace this with the correct role ID
const API_URL = resolveUrl(SUPERSET.baseURL, SUPERSET.apiPath);

const readAndParse = async (fileName: string) => {
    const BEARER_TOKEN = await getBearerToken(
      API_URL,
      {username: SUPERSET.username, password: SUPERSET.password, provider: 'db'
    });


    const CSRF_TOKEN = await getCSRFToken(API_URL, BEARER_TOKEN);
    const COOKIE = await getCookie(); // To-Do
    const AUTHORIZATION_HEADERS = getFormattedHeaders(BEARER_TOKEN, CSRF_TOKEN, COOKIE);
    const dashboardViewerPermissions = await getPermissionsByRoleID(
      API_URL,
      AUTHORIZATION_HEADERS,
      DASHBOARD_VIEWER_ROLE_ID
    );
    const PERMISSIONS = dashboardViewerPermissions.result.map((item: { id: number; }) => item.id);
    
    fs.createReadStream(fileName, 'utf-8')
    .on('error', () => {
        // handle error
    })
    .pipe(csv())
    .on('data', async (row: any) => {
        const role = generateRole(row.role, row.place);
        const rolePermissions = generatePermissions(PERMISSIONS);
        let result = await postRequest(
          API_URL,
          AUTHORIZATION_HEADERS,
          `/security/roles/`,
          stringifyRequest(role)
        );
        const createdRole = result as { id: string };
        const rowLevelSecurity = generateRowLevelSecurity(
          [createdRole.id],
          `chu_code`,
          row.place,
          CHA_TABLES
        );
        await postRequest(API_URL, AUTHORIZATION_HEADERS, `/security/roles/${createdRole.id}/permissions`, stringifyRequest(rolePermissions));
        const user = generateUser(row, [createdRole.id]);
        await postRequest(API_URL, AUTHORIZATION_HEADERS, `/security/users/`, stringifyRequest(user));
        await postRequest(API_URL, AUTHORIZATION_HEADERS, `/rowlevelsecurity/`, stringifyRequest(rowLevelSecurity));
    })

    .on('end', () => {
        // handle end of CSV
    })
};

readAndParse(DATA_FILE_PATH);
