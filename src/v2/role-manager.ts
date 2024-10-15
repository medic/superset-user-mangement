/**
 * Class to fetch and manage roles from Superset
 */

import rison from 'rison';
import { RequestInit } from 'node-fetch';
import { chaPermissionList, PermissionManager } from './permission-manager';
import { SupersetRole, RoleList } from './role.model';
import { MenuIds } from './permission.model';
import { AuthManager } from './auth-manager';

export class RoleManager {
  private authManager: AuthManager;
  private headers: any;

  constructor() {
    this.authManager = new AuthManager();
    this.headers = null;
  }

  private async initHeaders() {
    if (!this.headers) {
      this.headers = await this.authManager.getHeaders();
    }
  }

  /**
   * Fetches Superset Roles by page
   */
  public async fetchSupersetRoles() {
    await this.initHeaders();

    let currentPage = 0;
    let roles: SupersetRole[] = [];

    const request: RequestInit = {
      method: 'GET',
      headers: this.headers,
    };

    while (true) {
      const queryParams = rison.encode({ page: currentPage, page_size: 100 });
      const roleList: RoleList = (await this.authManager.fetchRequest(
        `/security/roles?q=${queryParams}`,
        request,
      )) as RoleList;

      // Append roles from the current page to the allRoles array
      roles = roles.concat(roleList.result);

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
  public async updateRolePermissions(roles: SupersetRole[]) {
    const headers = await this.initHeaders();

    const permissionManager = new PermissionManager(headers);

    const updatedRoles: number[] = [];
    const ids: MenuIds = {
      permission_view_menu_ids: chaPermissionList,
    };

    const batchSize = 150;
    for (let i = 0; i < roles.length; i += batchSize) {
      const batch = roles.slice(i, i + batchSize);

      for (const role of batch) {
        await permissionManager.updatePermissions(role.id, ids);
        updatedRoles.push(role.id);
      }
    }

    return updatedRoles;
  }
}
