import { RLSService } from "../src/service/rls-service";
import { AuthService } from "../src/service/auth-service";
import { Logger } from "../src/utils/logger";

async function updateCountyRLSPolicies() {
  try {
    Logger.info("Starting county RLS update process...");

    // Initialize services
    const authService = new AuthService();
    const rlsService = new RLSService(authService);

    // Step 1: Fetch all RLS policies
    Logger.info("Fetching all RLS policies...");
    const allPolicies = await rlsService.fetchRLSPolicies();
    Logger.info(`Found ${allPolicies.length} RLS policies`);

    // Step 2: Filter policies by county_name and exclude base RLS
    Logger.info("Filtering county RLS policies...");
    const countyPolicies = await rlsService.filterByGroupKey(allPolicies, 'county_name');
    const policiesToUpdate = countyPolicies.filter(policy => policy.id !== rlsService.BASE_CHA_RLS_ID);

    Logger.info(`Processing RLS policies:
      - Total policies: ${allPolicies.length}
      - County policies: ${countyPolicies.length}
      - Policies to update: ${policiesToUpdate.length}`);

    if (policiesToUpdate.length === 0) {
      Logger.warning("No county RLS policies found to update");
      return;
    }

    // Step 3: Fetch base tables and update county RLS policies
    Logger.info("Fetching base tables...");
    const baseTables = await rlsService.fetchBaseTables();
    Logger.info(`Found ${baseTables.length} base tables`);

    if (baseTables.length === 0) {
      Logger.error("No base tables found. Cannot proceed with updates.");
      return;
    }

    Logger.info("Updating county RLS policies with base tables...");
    const results = await rlsService.updateRLSTables(baseTables, policiesToUpdate);
    Logger.success(`Successfully updated ${results.length} county RLS policies`);

    Logger.success("County RLS update process completed successfully!");
  } catch (error) {
    Logger.error(error);
    process.exit(1);
  }
}

// Execute the script
updateCountyRLSPolicies().catch(error => Logger.error(error));
