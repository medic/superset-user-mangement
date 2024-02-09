import fs from 'fs';
import csv from 'csv-parser';
import { DATA_FILE_PATH } from './config/config';

import { getCSRFToken, getFormattedHeaders, loginResult } from './utils/auth';

import { getRoles } from './utils/role';

import { CSVUser } from './utils/user';

import { bulkUserUploadUg } from './bulk-user-upload';

const readAndParse = async (fileName: string) => {
  const tokens = await loginResult();

  const csrfToken = await getCSRFToken(tokens.bearerToken);

  const headers = getFormattedHeaders(
    tokens.bearerToken,
    csrfToken,
    tokens.cookie,
  );

  const rolesAvailableOnSuperset = await getRoles(headers);

  const users: CSVUser[] = [];

  fs.createReadStream(fileName, 'utf-8')
    .on('error', () => {
      // handle error
    })
    .pipe(csv())
    .on('data', (data) => users.push(data))

    .on('end', async () => {
      console.log(users);
      console.log(`Processed ${users.length} successfully`);
      await bulkUserUploadUg(users, rolesAvailableOnSuperset, headers);
    });
};

readAndParse(DATA_FILE_PATH);
