import fs from 'fs';
import csv from 'csv-parser';

import { SUPERSET, CHA_TABLES, DATA_FILE_PATH } from './config/config';
import { getBearerToken, getCSRFToken, getCookie, getFormattedHeaders } from './utils/auth';
import { generateRole, generatePermissions, getDashboardViewerPermissions, getRoles } from './utils/role';
import { generateRowLevelSecurity } from './utils/rowlevelsecurity';
import { generateUser } from './utils/user';

import { postRequest, stringifyRequest } from './utils/superset';

import { resolveUrl } from './utils/url';

const DASHBOARD_VIEWER_ROLE_ID = 4; // TODO replace this with the correct role ID
const API_URL = resolveUrl(SUPERSET.baseURL, SUPERSET.apiPath);

const readAndParse = async (fileName: string) => {
  const bearerToken = await getBearerToken();
  const csrfToken = await getCSRFToken(bearerToken);
  const cookie = await getCookie(); // To-Do
  const headers = getFormattedHeaders(bearerToken, csrfToken, cookie);

  const roles = await getRoles(API_URL, headers);
  console.log(roles);

  // const dashboardViewerPermissions = getDashboardViewerPermissions(API_URL, headers, DASHBOARD_VIEWER_ROLE_ID);

  // fs.createReadStream(fileName, 'utf-8')
  //   .on('error', () => {
  //     // handle error
  //   })
  //   .pipe(csv())
  //   .on('data', async (row: any) => {
  //     const role = generateRole(row.role, row.place);
  //     const rolePermissions = generatePermissions(dashboardViewerPermissions);
  //     let result = await postRequest(
  //       API_URL,
  //       headers,
  //       `/security/roles/`,
  //       stringifyRequest(role)
  //     );
  //     const createdRole = result as { id: string };
  //     const rowLevelSecurity = generateRowLevelSecurity(
  //       [createdRole.id],
  //       `chu_code`,
  //       row.place,
  //       CHA_TABLES
  //     );
  //     await postRequest(API_URL, headers, `/security/roles/${createdRole.id}/permissions`, stringifyRequest(rolePermissions));
  //     const user = generateUser(row, [createdRole.id]);
  //     await postRequest(API_URL, headers, `/security/users/`, stringifyRequest(user));
  //     await postRequest(API_URL, headers, `/rowlevelsecurity/`, stringifyRequest(rowLevelSecurity));
  //   })

  //   .on('end', () => {
  //     // handle end of CSV
  //   })
};

readAndParse(DATA_FILE_PATH);
