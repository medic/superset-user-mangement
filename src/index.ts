
import fs from 'fs';
import csv from 'csv-parser';

import { DATA_FILE_PATH } from './config/config';
import { loginResult, getCSRFToken, getFormattedHeaders } from './utils/auth';
import { getRoles, getUserRoles } from './utils/role';

import { CSVUser, User, createUserAccounts, generateUser } from './utils/user';

const readAndParse = async (fileName: string) => {
  const tokens = await loginResult();
  const csrfToken = await getCSRFToken(tokens.bearerToken);

  const headers = getFormattedHeaders(tokens.bearerToken, csrfToken, tokens.cookie);

  const roles = await getRoles(headers);
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
        const userRoles = getUserRoles(roles, user.place);

        if(userRoles.length === 0) {
          console.log(`No roles found for ${user.first_name} ${user.last_name} in ${user.place}`);
          return;
        }

        const su = generateUser(user, userRoles.map(r => r.id))
        supersetUsers.push(su);
      })

      console.log(supersetUsers);

      createUserAccounts(supersetUsers, headers);
    });
};

readAndParse(DATA_FILE_PATH);


