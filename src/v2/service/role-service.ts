/**
 * Class to fetch and manage roles from Superset
 */

import rison from "rison";
import {RequestInit} from "node-fetch";
import {PermissionService} from "./permission-service";
import {CreateRoleResponse, ParsedRole, RoleList, SupersetRole,} from "../model/role.model";
import {PermissionIds} from "../model/permission.model";
import {AuthService} from "./auth-service";
import {RoleRepository} from "../repository/role-repository";
import {RoleAdapter} from "../repository/role-adapter";
import {CSVUser} from "../model/user.model";
import {fetchRequest} from "../request-util";

export class RoleService {
  constructor(
    private readonly authService: AuthService = new AuthService(),
    private readonly roleStore: RoleRepository = new RoleRepository(),
    private readonly roleAdapter: RoleAdapter = new RoleAdapter(),
  ) {}

  /**
   * Fetches Superset Roles by page
   */
  public async fetchSupersetRoles() {
    const headers = await this.authService.getHeaders();

    console.log('Headers fetched successfully');

    let currentPage = 0;
    let roles: SupersetRole[] = [];

    const request: RequestInit = {
      method: 'GET',
      headers: headers,
    };

    while (true) {
      const queryParams = rison.encode({ page: currentPage, page_size: 100 });
      const roleList: RoleList = (await fetchRequest(
        `/security/roles?q=${queryParams}`,
        request,
      )) as RoleList;

      // Append roles from the current page to the allRoles array
      roles = roles.concat(roleList.result);

      console.log(`Fetched ${roleList.result.length} roles from page ${currentPage} \n
        ${roles.length} fetched so far`);

      // If there are no more roles on the current page, break out of the loop
      if (roleList.result.length === 0) {
        console.log(`Reached page ${currentPage}. No more roles to fetch.`);
        break;
      }

      // Increment the page value for the next request
      currentPage++;
    }

    return roles;
  }

  /**
   * Update role permissions on Superset in batches of 150
   */
  public async updateRolePermissions(
    roles: SupersetRole[],
    permissionIds: number[],
  ) {
    const permissionManager = new PermissionService();

    const updatedRoles: number[] = [];
    const ids: PermissionIds = {
      permission_view_menu_ids: permissionIds,
    };

    const batchSize = 150;
    for (let i = 0; i < roles.length; i += batchSize) {
      const batch = roles.slice(i, i + batchSize);

      for (const role of batch) {
        if (!role.id) throw Error('No ID provided for role');

        await permissionManager.updatePermissions(role.id, ids);
        updatedRoles.push(role.id);
      }
    }

    return updatedRoles;
  }

  /**
   * Create new role on Superset
   * @param names
   */
  async createRoles(names: string[]): Promise<SupersetRole[]> {
    const headers = await this.authService.getHeaders();

    const createRoleRequest = async (name: string) => {
      const request: RequestInit = {
        method: 'POST',
        headers: {
          ...headers,
          'Accept': 'application/json' // Ensure to set Content-Type as application/json
        },
        body: JSON.stringify({ name: name }),
      };

      console.log(`Creating role ${request.body}`);

      return (await fetchRequest(
        `/security/roles/`,
        request,
      )) as CreateRoleResponse;
    };

    const rolesPromises = names.map((name) =>
      createRoleRequest(name).catch((error) => {
        console.error(`Failed to create role ${name}:`, error);
        throw new Error(error);
      }),
    );

    const results = await Promise.all(rolesPromises);
    return results
      .filter((result) => result !== null)
      .map((result) => {
        

        return {
          id: Number(result.id), // Assuming `id` is directly on result
          name: result.result.name, // Assuming `result` is an object containing `name`
        };
      });
  }

  public async saveSupersetRoles(roles: SupersetRole[]) {
    const parsedRoles = await this.roleAdapter.toParsedRole(roles);
    await this.roleStore.saveRoles(parsedRoles);
  }

  public async getSavedSupersetRoles(): Promise<ParsedRole[]> {
    return await this.roleStore.fetchRoles();
  }

  public async matchRolesToUsers(users: CSVUser[]) {
    const roles = await this.getSavedSupersetRoles();

    users.forEach((user) => {
      const res = this.getRoles(user.chu, roles);
      console.log(`Found ${res.length} roles for ${user.username}}`);
    });
  }

  private getRoles(chuCodes: string, roles: ParsedRole[]): SupersetRole[] {
    console.log(`${roles.length} roles available`);

    const codes = chuCodes.split(',').map((code) => code.trim());

    return codes.flatMap((code) => {
      console.log(code);

      return roles
        .filter((role) => role.code === code)
        .map((role) => role.role);
    });
  }
}
