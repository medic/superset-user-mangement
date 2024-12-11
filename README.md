# 🧰 Superset Bulk Users

> This is a MVP script for loading bulk users to Superset via the [API](https://superset.apache.org/docs/api/). It expects a csv file, see /src/template.csv for a sample.

#### How it works
1. Requires an admin account to manage roles, RLS policies and users. 
2. When working with the different entities, there are a few things to keep in mind:
    - roles created have permissions allowing them access to desired datasources
    - RLS policies are attached to roles and ensure role based access to the datasources
    - users are assigned roles, and can be assigned multiple roles
3. Different Superset roles, RLS policies and users can be created depending on the user roles e.g CHA, County User, Subcounty User, National 
4. The API does not allow bulk upserts of roles, RLS policies and users. You will hit a rate limit if you make too many requests.  

#### How to use it
1. Populate your csv file, refer to the `./src/template.csv` for a sample
2. Define your environment variables - make a copy of `.env.template` and rename to `.env`
3. Install dependencies: run `npm i`

#### Creating Roles
Functions to create and manage roles are found in `./src/service/role-service.ts`. The process for creating roles is as follows:
1. There are already a number of roles present on Superset. They can be fetched from the API using the `getRoles` function. This method will fetch roles from Redis or Superset and return them as an array of SupersetRole objects.
2. You can use the `getRoleByName` function to fetch a specific role by name.
3. You can use the `createRoles` function to create new roles on Superset. Only the name is required for this step. 
4. You can use the `saveSupersetRoles` function to save the roles to Redis. This step is optional. Given the large number of roles present, it is recommended to save them to Redis for faster access as opposed to fetching them from Superset every time.
5. Update the role's permissions using the `updateRolePermissions` function. This will update the permissions for the role on Superset and grant access to the datasources specified in the permissions array. The permissions array is a list of permission IDs for datasets. 
6. Base Roles are defined for CHA and County. They can be fetched using the `fetchBaseRoles` function. The permissions for these can be used to update other roles. More base roles can be added as needed.
7. Creating a new role should be a two step process. First create the role, then update the permissions. This is to ensure the permissions are applied to the role.

#### Creating RLS Policies
Functions to create and manage RLS policies are found in `./src/service/rls-service.ts`. The process for creating RLS policies is as follows:
1. RLS policies can be fetched using the `fetchRLSPolicies` function. This function returns an array of RLS policies.
2. RLS policies can be created using the `createRLSPolicy` function. This function requires a name, group_key, clause, description, filter_type, roles and tables.
    - `Group key` defines the column used in filtering e.g `county_name`, `chu_code` etc. The column must exist in the table for the policy to work. 
    - `Clause` is what is filled in the filter e.g `county_name='Nairobi'`
    - `Roles` an array of role IDs that the policy should apply to. 
    - `Tables` an array of table IDs where the policy applies.
    - `Filter type` is always set to `Regular`. 
3. Base RLS policies are defined for County and CHU. More can be added as needed. These can be used to easily create more policies. 
4. RLS policy tables can be updated using the `updateRLSTables` function. In most cases, you will copy over the tables from the respective base RLS policy. 


#### Creating Users
Functions to manage users are found in `./src/service/user-service.ts`. The steps for user creation are as follows:
1. Create a user using the `createUserOnSuperset` function. This function requires a username, email, first name, last name, roles, and password. 
    - `Roles` is an array of role IDs that the user be given. This determines their access level.
    - `Password` is optional. It is recommended to use the existing passwords that users already have for eCHIS to prevent them from having too many passwords.
2. There `create-chas-from-csv` script can be leveraged as a guide to create users from a CSV file. It does the following:
    - Fetches and creates roles.
    - Creates RLS policies.
    - Creates users.
    - Detects and skips duplicates (on Superset) for roles, users and RLS policies.
    - User details missing usernames and passwords are auto-generated.
    - Creates CSV file with user details.

This script can be run multiple times without worry of duplicates.

### Important Notes
- Always test roles and RLS policies in a non-production environment first
- Regularly audit user permissions and access levels
- Back up existing configurations before making bulk changes
- Monitor API rate limits when creating multiple entities


