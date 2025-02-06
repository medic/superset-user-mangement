import { RLSService } from "../src/service/rls-service";
import { Logger } from "../src/utils/logger";

/**
 * Compares two arrays of table IDs to check if they contain the same tables
 */
function hasSameTables(tables1: number[], tables2: number[]): boolean {
  if (tables1.length !== tables2.length) return false;
  const sortedTables1 = [...tables1].sort();
  const sortedTables2 = [...tables2].sort();
  return sortedTables1.every((table, index) => table === sortedTables2[index]);
}

async function updateCHURLSPolicies() {
  try {
    Logger.info("Starting CHU RLS update process...");

    // Initialize services
    const rlsService = new RLSService();

    // Step 1: Fetch all RLS policies
    Logger.info("Fetching all RLS policies...");
    const allPolicies = await rlsService.fetchRLSPolicies();
    Logger.info(`Found ${allPolicies.length} RLS policies`);

    // Step 2: Filter policies by chu_code and exclude base RLS
    Logger.info("Filtering CHU RLS policies...");
    const chuPolicies = await rlsService.filterByGroupKey(allPolicies, 'chu_code');
    const policiesToUpdate = chuPolicies.filter(policy => policy.id !== rlsService.BASE_CHU_RLS_ID);

    Logger.info(`Processing RLS policies:
      - Total policies: ${allPolicies.length}
      - CHU policies: ${chuPolicies.length}
      - Policies to update: ${policiesToUpdate.length}`);

    if (policiesToUpdate.length === 0) {
      Logger.warning("No CHU RLS policies found to update");
      return;
    }

    // Step 3: Fetch base CHU tables
    Logger.info("Fetching base CHU tables...");
    const baseTables = await rlsService.fetchSupervisorTables();
    Logger.info(`Found ${baseTables.length} base CHU tables`);

    if (baseTables.length === 0) {
      Logger.error("No base CHU tables found. Cannot proceed with updates.");
      return;
    }

    // Step 4: Filter out policies that already have the correct tables
    Logger.info("Checking which policies need table updates...");
    const policiesToActuallyUpdate = policiesToUpdate.filter(policy => {
      const policyTableIds = policy.tables.map(table => table.id);
      const needsUpdate = !hasSameTables(policyTableIds, baseTables);
      
      if (!needsUpdate) {
        Logger.info(`Skipping policy ${policy.id} - tables already match base tables`);
      }
      
      return needsUpdate;
    });

    Logger.info(`Filtered policies requiring updates:
      - Original count: ${policiesToUpdate.length}
      - Need updates: ${policiesToActuallyUpdate.length}
      - Already up to date: ${policiesToUpdate.length - policiesToActuallyUpdate.length}`);

    if (policiesToActuallyUpdate.length === 0) {
      Logger.success("All CHU RLS policies are already up to date!");
      return;
    }

    // Step 5: Update the policies that need updating
    Logger.info(`Updating ${policiesToActuallyUpdate.length} CHU RLS policies with base CHU tables...`);
    const results = await rlsService.updateRLSTables(baseTables, policiesToActuallyUpdate);
    Logger.success(`Successfully updated ${results.length} CHU RLS policies`);

    Logger.success("CHU RLS update process completed successfully!");
  } catch (error: any) {
    Logger.error(error?.message || 'An unknown error occurred');
    process.exit(1);
  }
}

// Execute the script
updateCHURLSPolicies().catch(error => {
  Logger.error(error?.message || 'An unknown error occurred');
  process.exit(1);
});
