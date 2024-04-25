import { postRequest } from "./superset";

export interface User {
  active: boolean;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  password: string;
  roles: number[];
}

export interface CSVUser {
  first_name: string,
  last_name: string,
  username: string,
  email: string,
  role: string,
  chu: string,
  password: string
}

export const generateUser = (rawObj: CSVUser, rolesArray: any[]): User => {
  const { first_name, last_name, email, username, password } = rawObj;

  return {
    active: true,
    first_name,
    last_name,
    email,
    username,
    password,
    roles: rolesArray,
  };
};

export async function createUserAccounts(users: User[], headers: any) {
  for (const user of users) {
    console.log(JSON.stringify(user));

    const response = await postRequest(headers, `/security/users/`, user);
    console.log(response);
  }
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
