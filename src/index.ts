import { RedisService } from "./repository/redis-util";

/**
 * App entry point
 */



process.on('SIGINT', async () => {
  await RedisService.disconnect();
  process.exit(0);
});
