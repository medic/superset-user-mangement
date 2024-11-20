import { AuthService } from "./auth-service";
import {
  RLSList,
  RowLevelSecurity,
  UpdateRLSRequest,
  UpdateResult,
} from "../types/rls";
import { makeApiRequest } from "../utils/request.utils";
import { AxiosRequestConfig } from "axios";
import rison from "rison";
import { RlsRepository } from "../repository/rls-respository";


/**
 * Service class to manage Row Level Security (RLS) for roles.
 * This class provides methods to fetch, filter, save, and update RLS policies.
 * It interacts with an authentication service to handle API requests and uses
 * a repository to persist RLS data in Redis.
 */
export class RLSService {

  readonly BASE_RLS_ID = 3051;

  constructor(private readonly authService: AuthService = new AuthService()) { }

  /**
   * Fetches Superset Roles by page
   */
  public async fetchRLSPolicies(): Promise<RowLevelSecurity[]> {
    try {
      const headers = await this.authService.getHeaders();
      let currentPage = 0;
      let policies: RowLevelSecurity[] = [];

      while (true) {
        const queryParams = rison.encode({ page: currentPage, page_size: 100 });
        const request: AxiosRequestConfig = {
          method: "GET",
          headers: headers,
        };

        const response = await makeApiRequest(
          `/rowlevelsecurity/?q=${queryParams}`,
          request,
        );

        const rlsList: RLSList = response.data;

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
   * Fetch base RLS policy
   */
  async fetchBaseRLS() {
    const headers = await this.authService.getHeaders();
    const request: AxiosRequestConfig = {
      method: "GET",
      headers: headers,
    };

    const response = await makeApiRequest(
      `/rowlevelsecurity/${this.BASE_RLS_ID}`,
      request,
    );

    const policy = response.data ;

    return policy.result as RowLevelSecurity;
  }

  /**
   * Fetch base RLS policy tables
   */
  async fetchBaseTables(): Promise<number[]> {
    const tables = await this.fetchBaseRLS();
    return tables.tables.map(table => table.id);
  }

  /**
   * Updates the tables associated with multiple RLS policies
   * @param tables - Array of table IDs to associate with the policies
   * @param policies - Array of RLS policies to update
   * @returns Promise resolving to an array of update results
   * @throws Error if the update fails
   */
  async updateRLSTables(tables: number[], policies: RowLevelSecurity[]): Promise<UpdateResult[]> {
    const headers = await this.authService.getHeaders();
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

              const request: AxiosRequestConfig = {
                method: 'PUT',
                headers: headers,
                data: updateRequest,
              };

              const response = await makeApiRequest(
                `/rowlevelsecurity/${policy.id}`,
                request
              );

              const updateResponse = response.data;

              if (updateResponse.id) {
                results.push({
                  id: updateResponse.id,
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
}
