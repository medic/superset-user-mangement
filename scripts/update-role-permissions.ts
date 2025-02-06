import { PermissionService } from "../src/service/permission-service";
import { Logger } from "../src/utils/logger";

async function updateRolePermissions(baseRoleId: number, roleToUpdate: number) {
  try {
    const permissionService = new PermissionService();
    const baseRolePermissions = await permissionService.getPermissionsByRoleId(baseRoleId);
    const roleToUpdatePermissions = await permissionService.getPermissionsByRoleId(roleToUpdate);
    const updatedRolePermissions = Array.from(new Set([...baseRolePermissions, ...roleToUpdatePermissions]));
    await permissionService.updatePermissions(roleToUpdate, { permission_view_menu_ids: updatedRolePermissions });

    Logger.info(`Updated permissions for role ${roleToUpdate}`);

    process.exit(0);
  } catch (error) {
    Logger.error('An unknown error occurred');
    process.exit(1);
  }
}

updateRolePermissions(3412, 3585).catch(error => Logger.error(error));

