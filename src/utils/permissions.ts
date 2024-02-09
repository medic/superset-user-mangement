import { DASHBOARD_VIEWER } from './const';
import { IHeaders } from './interface';
import { SupersetRole } from './role';
import { getPermissionsByRoleID, postRequest } from './superset';

export const getUserPermissions = async (
  availableSupersetRoles: SupersetRole[],
  headers: IHeaders,
) => {
  const dasboardViewerRole = availableSupersetRoles.find(
    (ssrole: { id: number; name: string }) => ssrole.name === DASHBOARD_VIEWER,
  );

  if (!dasboardViewerRole) {
    throw new Error('Dashboard Viewer role does not exist. Please create it!');
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
  headers: IHeaders,
) => {
  try {
    const response = await postRequest(
      headers,
      `/security/roles/${roleId}/permissions`,
      JSON.stringify(permissions),
    );
    return response;
  } catch (error) {
    console.error('Error adding permissions for user role:', error);
  }
};
