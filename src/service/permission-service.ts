import { PermissionList, PermissionIds, UpdatePermissionResult, Permission } from '../types/permission';
import { AuthService } from './auth-service';
import { RedisService } from '../repository/redis-util';
import { Logger } from '../utils/logger';
import { API_URL, fetchWithAuth } from '../utils/request.utils';

/**
 * Class to manage permissions for roles on Superset
 */
export class PermissionService {
  private readonly DEFAULT_ROLE: number = 3051;

  constructor(private readonly authService: AuthService = AuthService.getInstance()) {}

  /**
   * Fetch permissions for a given role from Superset by roleId
   * @returns List of the role's permissions
   * @param roleId ID of role to pull
   */
  public async getPermissionsByRoleId(
    roleId: number = this.DEFAULT_ROLE,
  ): Promise<number[]> {
    Logger.info(`Fetching permissions for role ${roleId}`);

    try {
      const permissionList = await fetchWithAuth(
        `${API_URL()}/security/roles/${roleId}/permissions/`
      ) as PermissionList;

      return this.getPermissionIds(permissionList.result);
    } catch (error) {
      Logger.error(`Failed to fetch permissions for role ${roleId}: ${error}`);
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
    try {
      const response = await fetchWithAuth(
        `${API_URL()}/security/roles/${roleId}/permissions/`, 
        {
          method: 'POST',
          body: JSON.stringify(menuIds)
        }
      ) as UpdatePermissionResult;

      return response;
    } catch (error) {
      Logger.error(`Failed to update permissions for role ${roleId}: ${error}`);
      throw new Error(`Error updating permissions for role ${roleId}`);
    }
  }

  /**
   * Fetches permissions from the base user. These will be applied to
   * all other users of the same type.
   */
  public async fetchBasePermissions(): Promise<number[]> {
    Logger.info('Fetching base permissions');
    
    // first we check Redis for the permissions
    const permissionIds = await RedisService.getEntityIds('base_cha_permissions');
    if (permissionIds) return permissionIds;

    Logger.info('Permissions not found in Redis, fetching from Superset');
    // if not found, fetch from Superset
    const permissions = await this.getPermissionsByRoleId();
    await RedisService.saveEntityIds('base_cha_permissions', permissions);
    return permissions;
  }

  private getPermissionIds(permissions: Permission[]): number[] {
    return permissions.map((permission) => permission.id);
  }
}
