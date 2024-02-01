export const generateUser = (rawObj: any, rolesArray: any) => {
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
