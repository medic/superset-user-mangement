import rison from "rison";
import { PermissionService } from "./permission-service";
import { CreateRoleResponse, ParsedRole, RoleList, SupersetRole } from "../types/role";
import { PermissionIds } from "../types/permission";
import { AuthService } from "./auth-service";
import { RoleRepository } from "../repository/role-repository";
import { RoleAdapter } from "../repository/role-adapter";
import { CHAUser } from "../types/user";
import { API_URL, executeWithConcurrency, retryOperation, handleRequest } from "../utils/request.utils";
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
    let currentPage = 0;
    let roles: SupersetRole[] = [];

    while (true) {
      const queryParams = rison.encode({ page: currentPage, page_size: 100 });
      try {
        const roleList = await handleRequest(`${API_URL()}/security/roles?q=${queryParams}`) as RoleList;
        roles = roles.concat(roleList.result);

        Logger.info(`Fetched ${roleList.result.length} roles from page ${currentPage}`);
        Logger.info(`${roles.length} roles fetched so far`);

        if (roleList.result.length === 0) {
          Logger.info(`Reached page ${currentPage}. No more roles to fetch.`);
          break;
        }

        currentPage++;
      } catch (error) {
        Logger.error(`Error fetching roles: ${error}`);
        break;
      }
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

    Logger.info('Initial update completed. Successful updates:', Array.from(updatedRoles));

    // Retry failed roles
    const failedRoles = roles.filter(role => !updatedRoles.has(role.id!));

    if (failedRoles.length > 0) {
      Logger.info('Retrying failed roles:', failedRoles.map(role => role.id));
      const retryTasks = failedRoles.map((role) => () => updateRole(role));
      await executeWithConcurrency(retryTasks, 10);
      Logger.info('Retry update completed. Final successful updates:', Array.from(updatedRoles));
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
      Logger.info(`Creating role ${name}`);

      try {
        const url = `${API_URL()}/security/roles/`;
        const requestConfig = {
          headers: headers,
        };

        const response = await handleRequest(url, {
          method: 'POST',
          body: JSON.stringify({ name }),
          headers: requestConfig.headers
        }) as CreateRoleResponse;

        return response;
      } catch (error) {
        // if error is due to duplicate role name: (status code 422), fetch it from Superset
        if (error instanceof Error && error.message.includes('status: 422')) {
          // handle duplicate role case
          const existingRoles = await this.getRoleByName(name);
          if (existingRoles.count === 1) {
            Logger.info(`Role already exists. Id is ${existingRoles.result[0].id}`);
            return {
              id: `${existingRoles.result[0].id}`,
              result: {
                name: existingRoles.result[0].name
              },
              name: existingRoles.result[0].name
            };
          } else {
            Logger.error(`Failed to create role ${name}: ${error}`);
            throw new Error(`Error creating role ${name}: ` + error);
          }
        } else {
          Logger.error(`Failed to create role ${name}: ${error}`);
          throw new Error(`Error creating role ${name}: ` + error);
        }
      }
    };

    const rolesPromises = names.map((name) =>
      createRoleRequest(name).catch((error) => {
        Logger.error(`Failed to create role ${name}:`, error);
        throw new Error(`Error creating role ${name}: ` + error);
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
    const parsedRoles = this.roleAdapter.toParsedRole(roles);
    await this.roleStore.saveRoles(parsedRoles);
  }

  public async getSavedSupersetRoles(): Promise<ParsedRole[]> {
    return await this.roleStore.fetchRoles();
  }

  public async matchRolesToUsers(users: CHAUser[], roles: ParsedRole[]) {
    users.forEach((user) => {
      const res = this.matchRoles(user.chu, roles);
      Logger.info(`Found ${res.length} roles for ${user.username}}`);
    });
  }

  public getChuCodes(chuCodes: string): string[] {
    return chuCodes.split(',').map((code) => code.trim());
  }

  public matchRoles(chuCodes: string, roles: ParsedRole[]): SupersetRole[] {
    Logger.info(`${roles.length} roles available`);

    const codes = this.getChuCodes(chuCodes);

    return codes.flatMap((code) => {
      Logger.info(code);

      return roles
        .filter((role) => role.code === code)
        .map((role) => role.role);
    });
  }

  /**
   * Fetches a Superset Role by name
   * @param name - The name of the role to fetch
   * @returns Promise<ParsedRole | null>
   */
  public async getRoleByName(name: string): Promise<RoleList> {
    try {
      const filters = {
        filters: [{
          col: "name",
          opr: "eq",
          value: name
        }]
      };

      const risonQuery = rison.encode(filters);
      const response = await handleRequest(
        `${API_URL()}/security/roles/?q=${risonQuery}`
      ) as RoleList;

      return response;
    } catch (error) {
      Logger.error(`Error fetching role by name: ${error}`);
      throw error;
    }
  }

  /**
   * Fetches multiple Superset Roles by their names
   * @param names - Array of role names to fetch
   * @returns Promise<ParsedRole[]>
   */
  public async getRolesByName(names: string[]): Promise<RoleList> {
    try {
      const filters = {
        filters: [{
          col: "name",
          opr: "in",
          value: names
        }]
      };

      const risonQuery = rison.encode(filters);
      const response = await handleRequest(
        `${API_URL()}/security/roles/?q=${risonQuery}`
      ) as RoleList;

      return response;
    } catch (error) {
      Logger.error(`Error fetching roles by names: ${error}`);
      throw error;
    }
  }
}
