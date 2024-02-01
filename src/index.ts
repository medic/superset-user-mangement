
import fs from 'fs';
import csv from 'csv-parser';

import { SUPERSET, DATA_FILE_PATH } from './config/config';
import { getTokens, getCSRFToken, getFormattedHeaders } from './utils/auth';
import { parseUserCSV } from './utils/csvParser';
import { filterRoles, getRoles } from './utils/role';

import { resolveUrl } from './utils/url';
import { CSVUser, User, createUserAccounts, generateUser } from './utils/user';

const DASHBOARD_VIEWER_ROLE_ID = 4; // TODO replace this with the correct role ID
const API_URL = resolveUrl(SUPERSET.baseURL, SUPERSET.apiPath);

const readAndParse = async (fileName: string) => {
  const tokens = await getTokens();
  const csrfToken = await getCSRFToken(tokens.bearerToken);

  const headers = getFormattedHeaders(tokens.bearerToken, csrfToken, tokens.cookie);

  const roles = await getRoles(API_URL, headers);
  console.log(roles);

  let users: CSVUser[] = [];
  let supersetUsers: User[] = [];

  fs.createReadStream(fileName)
    .on('error', () => {
      throw new Error('File not found')
    })
    .pipe(csv())
    .on('data', (data: CSVUser) => {
      users.push(data);
    })
    .on('error', (error: Error) => {
      console.log(error.message);
    })
    .on('end', () => {
      console.log(users)
      console.log(`Processed ${users.length} successfully`);

      users.forEach(user => {
        const role = filterRoles(roles, user.place);

        if(role.length === 0) {
          console.log(`No role found for ${user.place}`);
          return;
        }

        supersetUsers.push(generateUser(user, role.map(r => r.name)));
      })

      console.log(supersetUsers);

      createUserAccounts(supersetUsers, headers);
    });




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



// readAndParse(DATA_FILE_PATH);


