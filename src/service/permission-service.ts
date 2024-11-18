/**
 * Helper functions for handling role permissions
 */

import axios, { AxiosRequestConfig } from 'axios';
import { PermissionList, PermissionIds, UpdateResult, Permission } from '../model/permission.model';
import { AuthService } from './auth-service';

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

    const request: AxiosRequestConfig = {
      method: 'GET',
      headers: headers,
    };

    try {
      const response = await axios(`/security/roles/${roleId}/permissions/`, request);
      const permissionList = response.data as PermissionList;

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
  ) {
    const headers = await this.authService.getHeaders();

    console.log(`Updating permissions for ${roleId} with ${menuIds.permission_view_menu_ids.length} permissions`);

    const request: AxiosRequestConfig = {
      method: 'POST',
      headers: headers,
      data: menuIds,
    };

    try {
      const response = await axios(`/security/roles/${roleId}/permissions`, request);
      return response.data as UpdateResult;
    } catch (error) {
      console.error(`Failed to update permissions for role ${roleId}:`, error);
      throw new Error(`Error updating permissions for role ${roleId}`);
    }
  }

  private getPermissionIds(permissions: Permission[]): number[] {
    return permissions.map((permission) => permission.id);
  }

  /**
   * Fetches permissions from the base user. These will be applied to
   * all other users of the same type.
   */
  public async fetchBasePermissions(){
    const permService = new PermissionService();
    return await permService.getPermissionsByRoleId();
  }
}
