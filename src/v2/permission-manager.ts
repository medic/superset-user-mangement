/**
 * Helper functions for handling role permissions
 */

import { RequestInit } from 'node-fetch';
import { PermissionList, MenuIds, UpdateResult } from './permission.model';
import { AuthManager } from './auth-manager';

export const chaPermissionList = [
  3, 7, 9, 11, 15, 22, 23, 30, 32, 41, 42, 43, 44, 45, 46, 47, 48, 50, 52, 53,
  55, 62, 63, 65, 67, 69, 70, 71, 78, 82, 83, 88, 90, 91, 92, 99, 102, 103, 104,
  105, 107, 108, 109, 110, 111, 112, 113, 114, 115, 118, 119, 120, 121, 122,
  123, 125, 126, 127, 128, 130, 131, 134, 135, 136, 138, 140, 141, 142, 144,
  145, 147, 148, 151, 162, 163, 164, 165, 166, 167, 169, 171, 178, 183, 185,
  186, 187, 188, 192, 194, 201, 202, 206, 207, 263, 266, 295, 296, 297, 350,
];

export class PermissionManager {
  private headers: any;
  private authManager: AuthManager;

  constructor(headers: any) {
    this.authManager = new AuthManager();
    this.headers = headers;
  }

  /**
   * Fetch permissions for a given role from Superset by roleId
   * @param roleID
   * @returns List of the role's permissions
   */
  public async getPermissionsByRoleId(roleId: number): Promise<PermissionList> {
    const request: RequestInit = {
      method: 'GET',
      headers: this.headers,
    };

    return (await this.authManager.fetchRequest(
      `/security/roles/${roleId}/permissions/`,
      request,
    )) as PermissionList;
  }

  /**
   * Replace the role's existing permissions with the new permission set
   * @param roleId Id of the role to be updated.
   * @param menuIds List of permission Ids to be appended to role
   * @returns list of updated permission ids
   */
  public async updatePermissions(
    roleId: number,
    menuIds: MenuIds,
  ): Promise<UpdateResult> {
    const request: RequestInit = {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(menuIds),
    };

    return (await this.authManager.fetchRequest(
      `/security/roles/${roleId}/permissions`,
      request,
    )) as UpdateResult;
  }
}
