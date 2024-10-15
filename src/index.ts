
import { AuthManager } from "./v2/auth-manager";
import { DATA_FILE_PATH } from "./v2/config";
import { parseCSV } from "./v2/csv-util";
import { PermissionManager } from "./v2/permission-manager";
import { Permission } from "./v2/permission.model";

/**
 * App entry point
 */
class App {
  private authManager: AuthManager;
  private filePath: string;

  constructor(filePath: string) {
    this.authManager = new AuthManager();
    this.filePath = filePath;
  }

  public readUsersFromCSV() {
    console.log(this.filePath);

    const users = parseCSV(this.filePath);
    return users;
  }
}

const app = new App(DATA_FILE_PATH);
const users = app.readUsersFromCSV();
console.table(users)
