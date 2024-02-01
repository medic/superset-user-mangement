import { CHA_TABLES, SUPERSET } from "../config/config";
import { resolveUrl } from '../utils/url';
import { postRequest } from "./superset";

const API_URL = resolveUrl(SUPERSET.baseURL, SUPERSET.apiPath);

export interface User {
  active: boolean;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  password: string;
  roles: any[];
}

export interface CSVUser {
  first_name: string,
  last_name: string,
  username: string,
  active: number,
  email: string,
  role: string,
  place: string,
  password: string
}

export const generateUser = (rawObj: any, rolesArray: any[]): User => {
  const { active, first_name, last_name, email, username, password } = rawObj;

  return {
    active,
    first_name,
    last_name,
    email,
    username,
    password,
    roles: rolesArray,
  };
};

export async function createUserAccounts(users: User[], headers: any) {
  users.forEach(async (user) => {
    const response = await postRequest(API_URL, headers, `/security/users/`, JSON.stringify(user));
    console.log(response.json());
  });
}

// export function createNewSupersetUser(csvUser: CSVUser, dashboardViewerPermissions:): User {
//   const role = generateRole(csvUser.role, csvUser.place);
//   const rolePermissions = generatePermissions(dashboardViewerPermissions);
//   let result = await postRequest(
//     API_URL,
//     headers,
//     `/security/roles/`,
//     stringifyRequest(role)
//   );
//   const createdRole = result as { id: string };
//   const rowLevelSecurity = generateRowLevelSecurity(
//     [createdRole.id],
//     `chu_code`,
//     row.place,
//     CHA_TABLES
//   );


//   const user = generateUser(csvUser, [csvUser.role]);
//   user.password = csvUser.password;
//   return user;
// }