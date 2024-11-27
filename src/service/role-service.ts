import rison from "rison";
import { AxiosRequestConfig } from "axios";
import { PermissionService } from "./permission-service";
import { CreateRoleResponse, ParsedRole, RoleList, SupersetRole } from "../types/role";
import { PermissionIds } from "../types/permission";
import { AuthService } from "./auth-service";
import { RoleRepository } from "../repository/role-repository";
import { RoleAdapter } from "../repository/role-adapter";
import { CSVUser } from "../types/user";
import { executeWithConcurrency, makeApiRequest, retryOperation } from "../utils/request.utils";
import { Logger } from "../utils/logger";

/**
 * Class responsible for managing roles in Superset.
 *
 * @remarks
 * This class provides methods to fetch, create, update, and delete roles from
 * Superset. It also provides a method to match roles to users based on chu codes.
 */
export class RoleService {
  constructor(
    private readonly authService: AuthService = AuthService.getInstance(),
    private readonly roleStore: RoleRepository = new RoleRepository(),
    private readonly roleAdapter: RoleAdapter = new RoleAdapter(),
  ) { }

  // fetch roles from Redis or Superset
  async getRoles(): Promise<ParsedRole[]> {
    const cachedRoles = await this.getSavedSupersetRoles();

    if (cachedRoles.length > 0) {
      Logger.info(`Fetched ${cachedRoles.length} roles from Redis`);
      return cachedRoles;
    } else {
      Logger.info(`Fetching roles from Superset`);
      const fetchedRoles = await this.fetchSupersetRoles();

      //save roles for subsequent use
      await this.saveSupersetRoles(fetchedRoles);
      Logger.info(`Fetched ${fetchedRoles.length} and saved roles from Superset`);

      return this.roleAdapter.toParsedRole(fetchedRoles);
    }
  }

  /**
   * Fetches Superset Roles by page
   */
  public async fetchSupersetRoles() {
    const headers = await this.authService.getHeaders();

    console.log("Headers fetched successfully");

    let currentPage = 0;
    let roles: SupersetRole[] = [];

    const request: AxiosRequestConfig = {
      method: "GET",
      headers: headers,
    };

    while (true) {
      const queryParams = rison.encode({ page: currentPage, page_size: 100 });
      const roleList: RoleList = (await makeApiRequest(
        `/security/roles?q=${queryParams}`,
        request,
      )) as RoleList;

      // Append roles from the current page to the allRoles array
      roles = roles.concat(roleList.result);

      console.log(`Fetched ${roleList.result.length} roles from page ${currentPage} \n
      ${roles.length} fetched so far`);

      // If there are no more roles on the current page, break out of the loop
      if (roleList.result.length === 0) {
        console.log(`Reached page ${currentPage}. No more roles to fetch.`);
        break;
      }

      // Increment the page value for the next request
      currentPage++;
    }

    return roles;
  }

  /**
   * Update role permissions on Superset in batches of 150
   */
  public async updateRolePermissions(
    roles: SupersetRole[],
    permissionIds: number[]
  ) {
    const permissionManager = new PermissionService();
    const updatedRoles: Set<number> = new Set();
    const ids: PermissionIds = {
      permission_view_menu_ids: permissionIds,
    };

    // Function to handle updating a single role
    const updateRole = async (role: SupersetRole) => {
      if (!role.id) throw new Error('No ID provided for role');
      await retryOperation(
        () => permissionManager.updatePermissions(role.id, ids),
        3, // retries
        1000, // delay between retries in ms
        10000 // timeout per operation in ms
      );
      updatedRoles.add(role.id); // Log successful updates
    };

    // Initial attempt to update all roles
    const initialTasks = roles.map((role) => () => updateRole(role));
    await executeWithConcurrency(initialTasks, 10); // Concurrency limit of 10

    console.log('Initial update completed. Successful updates:', Array.from(updatedRoles));

    // Retry failed roles
    const failedRoles = roles.filter(role => !updatedRoles.has(role.id!));
    console.log('Retrying failed roles:', failedRoles.map(role => role.id));

    if (failedRoles.length > 0) {
      const retryTasks = failedRoles.map((role) => () => updateRole(role));
      await executeWithConcurrency(retryTasks, 10);
      console.log('Retry update completed. Final successful updates:', Array.from(updatedRoles));
    }

    return Array.from(updatedRoles);
  }

  /**
   * Create new role on Superset
   * @param names
   */
  async createRoles(names: string[]): Promise<SupersetRole[]> {
    const headers = await this.authService.getHeaders();

    const createRoleRequest = async (name: string) => {
      const request: AxiosRequestConfig = {
        method: 'POST',
        headers: {
          ...headers,
          'Accept': 'application/json'
        },
        data: { name: name },
      };

      console.log(`Creating role ${name}`);

      const response = (await makeApiRequest(
        `/security/roles/`,
        request,
      )) as CreateRoleResponse;
      return response;
    };

    const rolesPromises = names.map((name) =>
      createRoleRequest(name).catch((error) => {
        console.error(`Failed to create role ${name}:`, error);
        throw new Error(error);
      }),
    );

    const results = await Promise.all(rolesPromises);
    return results
      .filter((result) => result !== null)
      .map((result) => ({
        id: Number(result.id),
        name: result.result.name,
      }));
  }

  public async saveSupersetRoles(roles: SupersetRole[]) {
    const parsedRoles = await this.roleAdapter.toParsedRole(roles);
    await this.roleStore.saveRoles(parsedRoles);
  }

  public async getSavedSupersetRoles(): Promise<ParsedRole[]> {
    return await this.roleStore.fetchRoles();
  }

  public async matchRolesToUsers(users: CSVUser[], roles: ParsedRole[]) {
    users.forEach((user) => {
      const res = this.matchRoles(user.chu, roles);
      console.log(`Found ${res.length} roles for ${user.username}}`);
    });
  }

  public matchRoles(chuCodes: string, roles: ParsedRole[]): SupersetRole[] {
    console.log(`${roles.length} roles available`);

    const codes = chuCodes.split(',').map((code) => code.trim());

    return codes.flatMap((code) => {
      console.log(code);

      return roles
        .filter((role) => role.code === code)
        .map((role) => role.role);
    });
  }
}
