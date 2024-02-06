import { DASHBOARD_VIEWER } from './const';
import { SupersetRole } from './role';
import { getPermissionsByRoleID, postRequest } from './superset';

export const getUserPermissions = async (
  availableSupersetRoles: SupersetRole[],
  headers: any,
) => {
  let dasboardViewerRole = availableSupersetRoles.find(
    (ssrole: { id: number; name: string }) => ssrole.name === DASHBOARD_VIEWER,
  );

  if (!dasboardViewerRole) {
    // Number got directly from Superset, could change
    dasboardViewerRole = { id: 7, name: DASHBOARD_VIEWER };
  }

  const dashboardViewerPermissions = await getPermissionsByRoleID(
    headers,
    dasboardViewerRole.id,
  );

  return dashboardViewerPermissions.result.map(
    (item: { id: number }) => item.id,
  );
};

export const addPermissionsForUserRole = async (
  roleId: number,
  permissions: {
    permission_view_menu_ids: number[];
  },
  headers: any,
) => {
  await postRequest(
    headers,
    `/security/roles/${roleId}/permissions`,
    JSON.stringify(permissions),
  );
};
