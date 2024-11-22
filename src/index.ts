import { CSVUser } from "./types/user";
import { AuthService } from "./service/auth-service";
import { DATA_FILE_PATH } from "./config";
import { parseCSV } from "./repository/csv-util";
import { PermissionService } from "./service/permission-service";
import { RoleService } from "./service/role-service";
import { RedisService } from "./repository/redis-util";
import { RLSService } from "./service/rls-service";
import { UserManager } from './service/user-service';
import { Logger } from './utils/logger';

/**
 * App entry point
 */
class App {
  private readonly roleService: RoleService;
  private readonly rlsService: RLSService;
  private readonly userManager: UserManager;
  private readonly permissionService: PermissionService;
  private readonly filePath: string;

  constructor(filePath: string) {
    this.roleService = new RoleService();
    this.rlsService = new RLSService();
    this.userManager = new UserManager();
    this.permissionService = new PermissionService();
    this.filePath = filePath;
  }

  async login() {
    // Removed AuthService initialization and setAuthService usage
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

    if ((!role || role.length === 0) || !permissions) return;
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

  async updateCHURLS() {
    const rls = await this.rlsService.fetchRLSPolicies();
    console.log(`Fetched ${rls.length} RLSs`)

    const countyRLS = await this.rlsService.filterByGroupKey(rls, 'chu_code');
    console.log(`Fetched ${countyRLS.length} CHU RLSs`);

    const rlsToUpdate = countyRLS.filter(policy => policy.id !== this.rlsService.BASE_CHA_RLS_ID);

    const tables = await this.rlsService.fetchBaseTables();
    const results = await this.rlsService.updateRLSTables(tables, rlsToUpdate);

    console.log(`Updated ${results.length} CHU RLSs`);

    return results;
  }



}

const app = new App(DATA_FILE_PATH);


process.on('SIGINT', async () => {
  await RedisService.disconnect();
  process.exit(0);
});
