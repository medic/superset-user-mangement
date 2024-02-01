interface User {
  active: boolean;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  password: string;
  roles: any[];
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