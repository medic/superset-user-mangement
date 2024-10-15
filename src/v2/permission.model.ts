/**
 * Models for managing permissions
 */

export interface PermissionList {
  result : Permission[]
}

export interface Permission {
  id: number, 
  permission_name: string,
  view_menu_name: string
}

export interface UpdateResult {
  result: MenuIds;
}

export interface MenuIds {
  permission_view_menu_ids: number[];
}
