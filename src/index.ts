import fs from 'fs';
import csv from 'csv-parser';
import { CHA_TABLES, DATA_FILE_PATH } from './config/config';

import { getCSRFToken, getFormattedHeaders, loginResult } from './utils/auth';

import {
  getRoles,
  generateRole,
  generatePermissions,
  createUserRole,
  SupersetRole,
} from './utils/role';

import {
  createRowlevelSecurity,
  generateRowLevelSecurity,
  getAvailableRowlevelSecurityFromSuperset,
} from './utils/rowlevelsecurity';
import { CSVUser, createUserAccount, generateUser } from './utils/user';

import { IRowLevelSecurityFromSuperset } from './utils/interface';
import {
  addPermissionsForUserRole,
  getUserPermissions,
} from './utils/permissions';

const readAndParse = async (fileName: string) => {
  const tokens = await loginResult();

  const csrfToken = await getCSRFToken(tokens.bearerToken);

  const headers = getFormattedHeaders(
    tokens.bearerToken,
    csrfToken,
    tokens.cookie,
  );

  const rolesAvailableOnSuperset = await getRoles(headers);

  const userPermissions = await getUserPermissions(
    rolesAvailableOnSuperset,
    headers,
  );

  const users: CSVUser[] = [];

  const { result: rowLevelFromSuperset } =
    await getAvailableRowlevelSecurityFromSuperset(headers);

  fs.createReadStream(fileName, 'utf-8')
    .on('error', () => {
      // handle error
    })
    .pipe(csv())
    .on('data', (data) => users.push(data))

    .on('end', async () => {
      console.log(users);
      console.log(`Processed ${users.length} successfully`);

      users.forEach(async (user) => {
        let userRole: SupersetRole;

        const generatedRole = generateRole(user.role, user.place);

        const existingRoleOnSuperset = rolesAvailableOnSuperset.find(
          (ssrole: { id: number; name: string }) =>
            ssrole.name === generatedRole.name,
        );

        if (existingRoleOnSuperset) {
          userRole = existingRoleOnSuperset;
        } else {
          userRole = await createUserRole(generatedRole, headers);
          rolesAvailableOnSuperset.push({
            id: userRole.id,
            name: userRole.name,
          });
        }

        const rolePermissions = generatePermissions(userPermissions);
        await addPermissionsForUserRole(userRole.id, rolePermissions, headers);

        const generatedUser = generateUser(user, [userRole.id]);
        await createUserAccount(generatedUser, headers);

        const rowLevelSecurity = generateRowLevelSecurity(
          [userRole.id],
          user.group,
          user.place,
          CHA_TABLES,
          user.role,
        );
        const doesRowLevelExist = rowLevelFromSuperset.some(
          (level: IRowLevelSecurityFromSuperset) =>
            level.name === rowLevelSecurity.name,
        );
        if (!doesRowLevelExist) {
          const response = await createRowlevelSecurity(
            rowLevelSecurity,
            headers,
          );
          rowLevelFromSuperset.push(response);
        }
      });
    });
};

readAndParse(DATA_FILE_PATH);
