import { createClient, RedisClientType } from 'redis';
import { Logger } from '../utils/logger';

export class RedisService {
  private static redisClient: RedisClientType | null = null;
  private static isConnected: boolean = false;

  private constructor() { } // Prevent instantiation

  public static async getClient(): Promise<RedisClientType> {
    if (!RedisService.redisClient) {
      RedisService.redisClient = createClient();
      RedisService.redisClient.on('error', (err) =>
        Logger.error('Redis Client Error', err)
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
        Logger.info('Redis client disconnected successfully.');
      } catch (disconnectError) {
        Logger.error(`Error disconnecting Redis client:  ${disconnectError}`);
      }
    }
  }

  // Save the table or permission ids to Redis
  public static async saveEntityIds(key: string, ids: number[]): Promise<void> {
    const client = await RedisService.getClient();
    await client.set(key, JSON.stringify(ids));
  }

  // Retrieve the table or permission ids from Redis
  public static async getEntityIds(key: string): Promise<number[] | null> {
    const client = await RedisService.getClient();
    const value = await client.get(key);
    if (!value) return null;
    return JSON.parse(value) as number[];
  }
}
