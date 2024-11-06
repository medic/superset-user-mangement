/**
 * Helper functions for handling role permissions
 */

import { RequestInit } from 'node-fetch';
import { PermissionList, PermissionIds, UpdateResult, Permission } from '../model/permission.model';
import { AuthService } from './auth-service';
import { fetchRequest } from '../request-util';

export class PermissionService {
  private readonly DEFAULT_ROLE: number = 3412;

  constructor(private readonly authService: AuthService = new AuthService()) {}

  /**
   * Fetch permissions for a given role from Superset by roleId
   * @returns List of the role's permissions
   * @param roleId ID of role to pull
   */
  public async getPermissionsByRoleId(
    roleId: number = this.DEFAULT_ROLE,
  ): Promise<number[]> {
    const headers = await this.authService.getHeaders();

    const request: RequestInit = {
      method: 'GET',
      headers: headers,
    };

    try {
      const permissionList =  (await fetchRequest(
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
    const headers = await this.authService.getHeaders();

    console.log( `Updating permissions for ${roleId} with ${menuIds.permission_view_menu_ids.length} permissions`)

    const request: RequestInit = {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(menuIds),
    };

    try {
      return (await fetchRequest(
        `/security/roles/${roleId}/permissions/`,
        request,
      )) as UpdateResult;
    } catch (error) {
      console.error(`Failed to update permissions for role ${roleId}:`, error);
      throw new Error(`Error updating permissions for role ${roleId}`);
    }
  }

  private readonly getPermissionIds = (permissions: Permission[]) => permissions.map((permission) => permission.id)
}
