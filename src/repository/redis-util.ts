import { createClient, RedisClientType } from 'redis';
import { Logger } from '../utils/logger';

export class RedisService {
  private static redisClient: RedisClientType | null = null;
  private static isConnected: boolean = false;

  private constructor() { } // Prevent instantiation

  public static async getClient(): Promise<RedisClientType> {
    if (!this.redisClient || !this.isConnected) {
      this.redisClient = createClient();
      this.redisClient.on('error', (err) =>
        Logger.error('Redis Client Error', err)
      );

      try {
        await this.redisClient.connect();
        this.isConnected = true;
      } catch (error) {
        Logger.error(`Failed to connect to Redis: ${error}`);
        throw error;
      }
    }

    return this.redisClient;
  }

  public static async disconnect(): Promise<void> {
    if (!this.redisClient || !this.isConnected) {
      return; // Already disconnected or never connected
    }

    try {
      await this.redisClient.disconnect();
    } catch (error) {
      // Only log the error if it's not a "client is closed" error
      if (!(error instanceof Error && error.message.includes('client is closed'))) {
        Logger.error(`Error disconnecting Redis client: ${error}`);
      }
    } finally {
      this.isConnected = false;
      this.redisClient = null;
    }
  }

  // Save the table or permission ids to Redis
  public static async saveEntityIds(key: string, ids: number[]): Promise<void> {
    const client = await this.getClient();
    await client.set(key, JSON.stringify(ids));
  }

  // Retrieve the table or permission ids from Redis
  public static async getEntityIds(key: string): Promise<number[] | null> {
    const client = await this.getClient();
    const value = await client.get(key);
    if (!value) return null;
    return JSON.parse(value) as number[];
  }
}
