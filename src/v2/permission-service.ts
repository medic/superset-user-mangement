/**
 * Helper functions for handling role permissions
 */

import { RequestInit } from 'node-fetch';
import { PermissionList, PermissionIds, UpdateResult, Permission } from './permission.model';
import { AuthService } from './auth-service';

export class PermissionService {
  private headers: any;
  private authManager: AuthService;

  private DEFAULT_ROLE: number = 174;

  constructor(headers: any) {
    this.authManager = new AuthService();
    this.headers = headers;
  }

  /**
   * Fetch permissions for a given role from Superset by roleId
   * @param roleID
   * @returns List of the role's permissions
   */
  public async getPermissionsByRoleId(
    roleId: number = this.DEFAULT_ROLE,
  ): Promise<number[]> {
    const request: RequestInit = {
      method: 'GET',
      headers: this.headers,
    };

    try {
      const permissionList =  (await this.authManager.fetchRequest(
        `/security/roles/${roleId}/permissions/`,
        request,
      )) as PermissionList

      return this.getPermissionIds(permissionList.result);
    } catch (error) {
      console.error(`Failed to fetch permissions for role ${roleId}:`, error);
      throw new Error(`Error fetching permissions for role ${roleId}`);
    }
  }

  /**
   * Replace the role's existing permissions with the new permission set
   * @param roleId Id of the role to be updated.
   * @param menuIds List of permission Ids to be appended to role
   * @returns list of updated permission ids
   */
  public async updatePermissions(
    roleId: number,
    menuIds: PermissionIds,
  ): Promise<UpdateResult> {
    const request: RequestInit = {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(menuIds),
    };

    try {
      return (await this.authManager.fetchRequest(
        `/security/roles/${roleId}/permissions`,
        request,
      )) as UpdateResult;
    } catch (error) {
      console.error(`Failed to update permissions for role ${roleId}:`, error);
      throw new Error(`Error updating permissions for role ${roleId}`);
    }
  }

  private getPermissionIds = (permissions: Permission[]) => permissions.map((permission) => permission.id)
}
