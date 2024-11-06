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
  private authService: AuthService;
  private roleService: RoleService;
  private readonly filePath: string;

  constructor(filePath: string) {
    this.authService = new AuthService();
    this.roleService = new RoleService();
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

  async fetchBasePermissions(){
    const permService = new PermissionService();
    return await permService.getPermissionsByRoleId();
  }

  async createBaseRole() {
    // const permissions = await this.fetchBasePermissions();
    // console.log(`We have ${permissions.length} permissions`)

    const role = await this.roleService.createRoles(['Base CHA Role'])
    console.log(`Role creation result`);
    console.log(role)

    // if((!role || role.length === 0) || !permissions) return;
    // const updateRole = await this.roleService.updateRolePermissions(role, permissions)
    // console.log(`Updated role ${updateRole}`)

    return role;
  }
}

const app = new App(DATA_FILE_PATH);
app.createBaseRole()
// app.fetchBasePermissions().then((list) => console.log(list));
// app.updateLocalRoles();
// const users = app.readUsersFromCSV();
// console.table(users)
