export const generateRole = (userType: string, placeCode: number) => (
  {
    name: `${userType}_${placeCode}`
  }
);

export const generatePermissions = (permissions: any) => (
  {
    permission_view_menu_ids: permissions
  }
);
