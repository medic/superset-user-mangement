
import { AuthManager } from "./v2/auth-manager";
import { DATA_FILE_PATH } from "./v2/config";
import { parseCSV } from "./v2/csv-util";
import { PermissionManager } from "./v2/permission-manager";
import { Permission } from "./v2/permission.model";
import { RoleManager } from "./v2/role-manager";

/**
 * App entry point
 */
class App {
  private authManager: AuthManager;
  private roleManager: RoleManager;
  private filePath: string;

  constructor(filePath: string) {
    this.authManager = new AuthManager();
    this.roleManager = new RoleManager();
    this.filePath = filePath;
  }

  public readUsersFromCSV() {
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

}

const app = new App(DATA_FILE_PATH);
app.updateLocalRoles();
// const users = app.readUsersFromCSV();
// console.table(users)
