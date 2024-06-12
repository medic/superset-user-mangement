import { postRequest } from "./superset";
import {createClient} from "redis";
import {getCHUCodes} from "./role";

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

export async function generateSupersetUsers(users: CSVUser[]): Promise<User[]> {
  const supersetUsers: User[] = [];

  const redisClient = createClient()
  await redisClient.connect()

  users.forEach(user => {
    const chuCodes = getCHUCodes(user.chu)

    const roles: string[] = [];
    chuCodes.forEach(chuCode => {
      const role = redisClient.hGet(chuCode, "role");


    });

    supersetUsers.push(generateUser(user, roles));
  });

  return supersetUsers;
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
