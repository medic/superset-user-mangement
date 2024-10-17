
import { CSVUser } from "./utils/user";
import { AuthService } from "./v2/auth-service";
import { DATA_FILE_PATH } from "./v2/config";
import { parseCSV } from "./v2/csv-util";
import { PermissionService } from "./v2/permission-service";
import { Permission } from "./v2/permission.model";
import { RoleService } from "./v2/role-service";

/**
 * App entry point
 */
class App {
  private authManager: AuthService;
  private roleManager: RoleService;
  private filePath: string;

  constructor(filePath: string) {
    this.authManager = new AuthService();
    this.roleManager = new RoleService();
    this.filePath = filePath;
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
    const fetchedRoles = await this.roleManager.fetchSupersetRoles();
    console.log(`Fetched ${fetchedRoles.length} roles from Superset}`);

    await this.roleManager.saveSupersetRoles(fetchedRoles);
  }

  public async matchUsersToRoles() {
    const users = await this.readUsersFromCSV();
    this.roleManager.matchRolesToUsers(users);
  }

}

const app = new App(DATA_FILE_PATH);
app.matchUsersToRoles();
// app.updateLocalRoles();
// const users = app.readUsersFromCSV();
// console.table(users)
