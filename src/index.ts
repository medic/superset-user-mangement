
import { CSVUser } from "./utils/user";
import { AuthService } from "./v2/service/auth-service";
import { DATA_FILE_PATH } from "./v2/config";
import { parseCSV } from "./v2/repository/csv-util";
import { PermissionService } from "./v2/service/permission-service";
import { RoleService } from "./v2/service/role-service";

/**
 * App entry point
 */
class App {
  private authService: AuthService;
  private roleService: RoleService;
  private filePath: string;

  constructor(filePath: string) {
    this.authService = new AuthService();
    this.roleService = new RoleService();
    this.filePath = filePath;
  }

  async login(){
    this.authService.login()
  }

  /**
   * Retrieve CHA user data from the CSV
   * @returns 
   */
  public async readUsersFromCSV(): Promise<CSVUser[]> {
    console.log(this.filePath);

    const users = parseCSV(this.filePath);
    return users;
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
    this.roleService.matchRolesToUsers(users);
  }

  async fetchBasePermissions(){
    const permService = new PermissionService();
    const permissions = await permService.getPermissionsByRoleId();

    console.log(permissions)
  }

}

const app = new App(DATA_FILE_PATH);
app.fetchBasePermissions();
// app.matchUsersToRoles();
// app.updateLocalRoles();
// const users = app.readUsersFromCSV();
// console.table(users)
