# Superset User Management

This project provides a set of functions to help you manage users, roles and permissions in Superset.

## Installation

Clone the repository and install the dependencies:
```bash
npm install
```


# Usage

It is recommended to run the application locally and test using a local Superset instance before working on the production instance. You can find instructions for installing and running Superset from their [Docs](https://superset.apache.org/docs/quickstart/)
A REST API is available at `{{superset_url}}/swagger/v1`. To access the security endpoints that allow you to manage roles, add the 
following to your Superset config file `superset_config.py`:

`FAB_ADD_SECURITY_API = True`

Restart the Superset container for the setting to take effect. You should now have access to the security endpoints.

### Authentication

An admin account is required to make any requests to the Superset API. The username and password can be configured in the .env file, along with the Superset URL. 

`POST` and `PUT` requests require an additional header: `X-CSRFToken` which can be obtained by logging in to Superset, then visiting the `/security/csrf_token/` endpoint with the access token in the `Authorization` header.

### Roles

These define what datasets (tables) and permissions a user has access to. Roles are meant to be re-usable and can be re-assigned when users are moved between places. 

### Row-level security

These define what datasets and roles restrictions apply to. For example, a CHA role should have access to data from their CHU only. 
As such, The RLS policy contains a clause e.g chu_code = `{{chu_code}}`. The query builder will replace this with the CHU code of the user and append it to the select query. The same applies to sub-county and county users. RLS policies only apply to roles.

### Users

Users are assigned roles which in turn have the requisite RLS policies attached. User accounts are to be deactivated by setting toggling the `active` status on the UI or setting `"active": false` in the payload.


## Creating Roles

We will be dealing with 3 main types of roles:
- County
- Sub-county
- CHA

Create these roles first, either through the Superset UI or by making a `POST` request to the endpoint `/security/roles/` with the following JSON payload:

```json
{
    "name": "string"
}
```

A successful response will look like this:
```json
{
  "id": "string",
  "result": {
    "name": "string"
  }
}
```
Use the `id` from the response to update the role permissions via a `POST` request to the endpoint `/security/roles/{role_id}/permissions/`. The payload should be a list of permission ids. 

```json
{
  "permission_view_menu_ids": [
    0
  ]
}
```
Subsequent roles for individual types will be copied off of these `base` roles. There are scripts on this repository that will help you do this automatically. 

## Creating RLS policies

The process is similar to the one above for creating roles. You can either create a RLS policy via the Superset UI or via the API.  The `group key` and `clause` are the important bits here and should be configured accordingly. They determine what level of access the role will have. For example, the clause 'county_name' = '{{county_name}}' will allow the role to access data from the specified county. To create a RLS policy via the API, use the following JSON payload format:

```json
{
  "clause": "string",
  "description": "string",
  "filter_type": "Regular",
  "group_key": "string",
  "name": "string",
  "roles": [
    0
  ],
  "tables": [
    0
  ]
}
```
to the `/rowlevelsecurity/` endpoint. 

Updating RLS policies can be done either through the Superset UI or by making a `PUT` request to the endpoint `/rowlevelsecurity/` with a similar payload as above.

## Creating Users

Users can be assigned multiple roles. This is key for CHAs who will need to have access to multiple CHUs. Users who are no longer active do not need to have access to any data and their accounts should be deactivated. Their roles can then be re-assigned to the new active users. 


## Scripts

The scripts are contained in the `scripts` folder. They can be modified or new one added to suit your needs. 

- `create-chas.ts` creates CHA users from a CSV file. The required parameters are:
    - `email`
    - `first_name`
    - `last_name`
    - `chu`
    - `password`
    
    If no password is provided, a random one will be generated. The username is generated from the first name and last name. A CSV file with the credentails created will be generated and stored in the `data` folder. 
    
    To run the script, use the following command:
    ```bash
    npx ts-node scripts/create-chas.ts <csv_file_path>
    ```

- `create-subcounty-users.ts` creates sub-county users from a CSV file. The required parameters are:
    - `email`
    - `subcounty`
    - `county`
    
    Add a `subcounty-users.csv` to the `data` folder before running the script. It should have the following format:
    ```csv
    email,subcounty,county
    ```

    To run the script, use the following command:
    ```bash
    npx ts-node scripts/create-subcounty-users.ts
    ```

    A csv file with the credentails created will be generated and stored in the `data` folder.