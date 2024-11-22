import { createClient, RedisClientType } from 'redis';

export class RedisService {
  private static redisClient: RedisClientType | null = null;
  private static isConnected: boolean = false;

  private constructor() { } // Prevent instantiation

  public static async getClient(): Promise<RedisClientType> {
    if (!RedisService.redisClient) {
      RedisService.redisClient = createClient();
      RedisService.redisClient.on('error', (err) =>
        console.error('Redis Client Error', err)
      );
    }

    if (!RedisService.isConnected) {
      await RedisService.redisClient.connect();
      RedisService.isConnected = true;
    }

    return RedisService.redisClient;
  }

  public static async disconnect(): Promise<void> {
    if (RedisService.redisClient && RedisService.isConnected) {
      try {
        await RedisService.redisClient.disconnect();
        RedisService.isConnected = false;
        console.log('Redis client disconnected successfully.');
      } catch (disconnectError) {
        console.error('Error disconnecting Redis client:', disconnectError);
      }
    }
  }
}
