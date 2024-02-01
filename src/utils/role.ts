export const generateRole = (userType: string, placeCode: string) => ({
  name: `${userType}_${placeCode}`,
});

export const generatePermissions = (permissions: any) => ({
  permission_view_menu_ids: permissions,
});
