import { IHeaders, IUser } from './interface';
import { postRequest } from './superset';

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
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  role: string;
  place: string;
  password: string;
  group: string;
}

export const generateUser = (rawObj: any, rolesArray: any) => {
  const {
    active,
    first_name,
    last_name,
    email,
    username,
    password,
    group,
    place,
  } = rawObj;
  return {
    active,
    first_name,
    last_name,
    email,
    username,
    password,
    roles: rolesArray,
    place,
    group,
  };
};

export const createUserAccount = async (user: IUser, headers: IHeaders) => {
  try {
    const response = await postRequest(
      headers,
      `/security/users/`,
      JSON.stringify(user),
    );
    return response;
  } catch (error) {
    console.error('Error creating user account:', error);
  }
};
