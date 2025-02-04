import { AuthService } from "./auth-service";
import {
  RLSList,
  RowLevelSecurity,
  UpdateRLSRequest,
  UpdateRLSResponse,
  UpdateResult,
} from "../types/rls";
import { Logger } from '../utils/logger';
import { API_URL, handleRequest } from '../utils/request.utils';
import rison from "rison";
import { RlsRepository } from "../repository/rls-repository";

/**
 * Service class to manage Row Level Security (RLS) for roles.
 * This class provides methods to fetch, filter, save, and update RLS policies.
 * It interacts with an authentication service to handle API requests and uses
 * a repository to persist RLS data in Redis.
 */
export class RLSService {

  readonly BASE_COUNTY_RLS_ID = 3051;
  readonly BASE_CHU_RLS_ID = 3052;

  constructor(private readonly authService: AuthService = AuthService.getInstance()) { }

  // fetch RLS policies from Redis or Superset
  async getRLSPolicies(): Promise<RowLevelSecurity[]> {
    const cachedRLS = await this.fetchSavedRLSPolicies();
    if (cachedRLS.length > 0) {
      Logger.info(`Fetched ${cachedRLS.length} RLS policies from Redis`);
      return cachedRLS;
    } else {
      Logger.info(`Fetching RLS policies from Superset`);
      const fetchedRLS = await this.fetchRLSPolicies();

      //save roles for subsequent use
      await this.saveRLSPolicies(fetchedRLS);
      Logger.info(`Fetched ${fetchedRLS.length} and saved RLS policies from Superset`);

      return fetchedRLS;
    }
  }

  /**
   * Fetches Superset Roles by page
   */
  public async fetchRLSPolicies(): Promise<RowLevelSecurity[]> {
    try {
      let currentPage = 0;
      let policies: RowLevelSecurity[] = [];

      while (true) {
        const queryParams = rison.encode({ page: currentPage, page_size: 100 });
       
        const url = `${API_URL()}/rowlevelsecurity/?q=${queryParams}`;
        const response = await handleRequest(url, {
          method: 'GET',
        });

        const rlsList: RLSList = response as RLSList;

        if (!rlsList?.result) {
          throw new Error('Failed to fetch RLS policies: Invalid response format');
        }

        policies = policies.concat(rlsList.result);

        if (rlsList.result.length === 0) {
          break;
        }

        currentPage++;
      }

      return policies;
    } catch (error) {
      console.error(`Failed to fetch RLS policies: ${error}`);
      throw new Error(`Failed to fetch RLS policies: ${error}`);
    }
  }

  /**
   * Filters RLS policies by the group key e.g county name, chu_code
   * @param policies
   * @param groupKey
   */
  async filterByGroupKey(policies: RowLevelSecurity[], groupKey: string): Promise<RowLevelSecurity[]> {
    if (!policies || !Array.isArray(policies)) {
      throw new Error('Invalid policies input: Expected array of RowLevelSecurity');
    }
    if (!groupKey || typeof groupKey !== 'string') {
      throw new Error('Invalid groupKey input: Expected non-empty string');
    }

    return policies.filter((policy) => policy.group_key === groupKey);
  }

  /**
   * Convert and save RLS to Redis
   * @param policies
   */
  async saveRLSPolicies(policies: RowLevelSecurity[]) {
    const rlsRepo = new RlsRepository();
    const rlsEntities = rlsRepo.toRLSEntity(policies);

    await rlsRepo.saveRLSPolicies(rlsEntities);
  }

  /**
   * Fetch RLS policies from Redis
   */
  async fetchSavedRLSPolicies(): Promise<RowLevelSecurity[]> {
    const rlsRepo = new RlsRepository();
    const rlsEntities = await rlsRepo.fetchRoles();

    return rlsEntities.map(entity => entity.rls);
  }

  /**
   * Fetch base RLS policy
   */
  async fetchBaseRLS(id: number): Promise<RowLevelSecurity> {
    return this.fetchRLSById(id);
  }

  /**
   * Fetch base CHA RLS policy tables
   */
  async fetchBaseCountyTables(): Promise<number[]> {
    return this.fetchRLSTables(this.BASE_COUNTY_RLS_ID);
  }

  /**
   * Fetch base CHU RLS policy tables
   */
  async fetchBaseCHUTables(): Promise<number[]> {
    return this.fetchRLSTables(this.BASE_CHU_RLS_ID);
  }

  /**
   * Fetch RLS policy by ID
   * @param rlsId - ID of the RLS policy to fetch
   */
  async fetchRLSById(rlsId: number): Promise<RowLevelSecurity> {
    const url = `${API_URL()}/rowlevelsecurity/${rlsId}`;
    const response = await handleRequest(url, {
      method: 'GET',
    });

    return response.result as RowLevelSecurity;
  }

  /**
   * Fetch tables from an RLS policy
   * @param rlsId - ID of the RLS policy to fetch tables from
   */
  async fetchRLSTables(rlsId: number): Promise<number[]> {
    const policy = await this.fetchRLSById(rlsId);
    return policy.tables.map(table => table.id);
  }

  /**
   * Fetches a RLS policy by name
   * @param name - The name of the RLS policy to fetch
   * @returns Promise<RowLevelSecurity | null>
   */
  public async getRLSByName(name: string): Promise<RowLevelSecurity | null> {
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
        `${API_URL()}/rowlevelsecurity/?q=${risonQuery}`
      ) as RLSList;

      if (response.count !== 0 && response.result.length > 0) {
        return response.result[0];
      }
      
      return null;
    } catch (error) {
      Logger.error(`Error fetching RLS by name: ${error}`);
      throw error;
    }
  }

  /**
   * Fetches multiple RLS policies by their names
   * @param names - Array of RLS policy names to fetch
   * @returns Promise<RowLevelSecurity[]>
   */
  public async getRLSByNames(names: string[]): Promise<RowLevelSecurity[]> {
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
        `${API_URL()}/rowlevelsecurity/?q=${risonQuery}`
      ) as RLSList;

      if (response.count !== 0 && response.result.length > 0) {
        return response.result;
      }
      
      return [];
    } catch (error) {
      Logger.error(`Error fetching RLS by names: ${error}`);
      throw error;
    }
  }

  /**
   * Updates the tables associated with multiple RLS policies
   * @param tables - Array of table IDs to associate with the policies
   * @param policies - Array of RLS policies to update
   * @returns Promise resolving to an array of update results
   * @throws Error if the update fails
   */
  async updateRLSTables(tables: number[], policies: RowLevelSecurity[]): Promise<UpdateResult[]> {
    const results: UpdateResult[] = [];
    const failedUpdates: RowLevelSecurity[] = [];
    const BATCH_SIZE = 20;
    const RETRY_DELAY = 10000; // 10 seconds
    const MAX_RETRIES = 3;

    try {
      // Process policies in batches
      for (let i = 0; i < policies.length; i += BATCH_SIZE) {
        const batch = policies.slice(i, i + BATCH_SIZE);

        // Process each policy in the current batch
        const batchPromises = batch.map(async (policy) => {
          let retries = 0;

          while (retries < MAX_RETRIES) {
            try {
              const updateRequest: UpdateRLSRequest = {
                clause: policy.clause,
                description: policy.description,
                filter_type: policy.filter_type,
                group_key: policy.group_key,
                name: policy.name,
                roles: policy.roles.map(role => role.id),
                tables: tables // Update with new table IDs
              };

              // Update the RLS policy
              const url = `${API_URL()}/rowlevelsecurity/${policy.id}`;
              const response = await handleRequest(url, {
                method: 'PUT',
                body: JSON.stringify(updateRequest)
              }) as UpdateResult;

              if (response.id) {
                results.push({
                  id: response.id,
                  status: 'success',
                  message: `Successfully updated RLS policy ${policy.name}`
                });
              }

              return;
            } catch (error) {
              console.log(error);

              if (retries < MAX_RETRIES - 1) {
                retries++;
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                continue;
              }

              failedUpdates.push(policy);
              results.push({
                id: policy.id,
                status: 'error',
                message: `Failed to update RLS policy ${policy.name}: ${error}`
              });
              break;
            }
          }
        });

        // Wait for all policies in the current batch to complete
        await Promise.all(batchPromises);

        // Add a small delay between batches to prevent rate limiting
        if (i + BATCH_SIZE < policies.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Retry failed updates one last time
      if (failedUpdates.length > 0) {
        console.log(`Retrying ${failedUpdates.length} failed updates...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));

        const retryResults = await this.updateRLSTables(tables, failedUpdates);
        results.push(...retryResults);
      }

      return results;
    } catch (error) {
      console.error(`Failed to update RLS tables: ${error}`);
      throw new Error(`Failed to update RLS tables: ${error}`);
    }
  }

  /**
   * Create a new RLS policy on Superset
   */
  async createRLSPolicy(policy: UpdateRLSRequest): Promise<UpdateRLSResponse> {
    const url = `${API_URL()}/rowlevelsecurity/`;
    
    try {
      const response = await handleRequest(url, {
        method: 'POST',
        body: JSON.stringify(policy)
      });
      return response as UpdateRLSResponse;
    } catch (error) {
      // If error is due to duplicate RLS policy (status code 422), ignore it
      if (error instanceof Error && error.message.includes('status: 422')) {
        Logger.info(`RLS policy already exists for ${policy.name}, skipping creation`);
        return { id: 0, result: { name: policy.name } } as UpdateRLSResponse;
      }
      Logger.error(`Failed to create RLS policy ${policy.name}: ${error}`);
      throw error;
    }
  }

}
