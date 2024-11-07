import {CSVUser} from "./utils/user";
import {AuthService} from "./v2/service/auth-service";
import {DATA_FILE_PATH} from "./v2/config";
import {parseCSV} from "./v2/repository/csv-util";
import {PermissionService} from "./v2/service/permission-service";
import {RoleService} from "./v2/service/role-service";

/**
 * App entry point
 */
class App {
  private readonly authService: AuthService;
  private readonly roleService: RoleService;
  private readonly permissionService: PermissionService;
  private readonly filePath: string;

  constructor(filePath: string) {
    this.authService = new AuthService();
    this.roleService = new RoleService();
    this.permissionService = new PermissionService();
    this.filePath = filePath;
  }

  async login(){
    await this.authService.login()
  }

  /**
   * Retrieve CHA user data from the CSV
   * @returns
   */
  public async readUsersFromCSV(): Promise<CSVUser[]> {
    console.log(this.filePath);

    return parseCSV(this.filePath);
  }

  /**
   * Fetch roles from Superset and update list stored in Redis
   */
  public async updateLocalRoles() {
    const fetchedRoles = await this.roleService.fetchSupersetRoles();
    console.log(`Fetched ${fetchedRoles.length} roles from Superset}`);

    await this.roleService.saveSupersetRoles(fetchedRoles);
  }

  public async matchUsersToRoles() {
    const users = await this.readUsersFromCSV();
    await this.roleService.matchRolesToUsers(users);
  }

  async createBaseRole() {
    const permissions = await this.permissionService.fetchBasePermissions();

    const role = await this.roleService.createRoles(['Base CHA Role'])

    if((!role || role.length === 0) || !permissions) return;
    const updateRole = await this.roleService.updateRolePermissions(role, permissions)
    console.log(`Updated role ${updateRole}`)

    return role;
  }

  async updateRolePermissions() {
    const roles = await this.roleService.getSavedSupersetRoles();
    console.log(`Fetched ${roles.length} saved roles`)

    const permissions = await this.permissionService.fetchBasePermissions();
    console.log(`Fetched ${roles.length} permissions`)

    const supersetRoles = roles.map(role => role.role);
    return await this.roleService.updateRolePermissions(supersetRoles, permissions);
  }
}

const app = new App(DATA_FILE_PATH);
app.updateRolePermissions().then((res) => console.log(res));

