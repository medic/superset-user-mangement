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

  // Save array data as a string in Redis
  public static async saveArrayData(key: string, data: any[]): Promise<void> {
    const client = await this.getClient();
    try {
      await client.set(`array:${key}`, JSON.stringify(data));
    } catch (error) {
      Logger.error(`Error saving array data to Redis: ${error}`);
      throw error;
    }
  }

  // Retrieve array data from Redis
  public static async getArrayData<T>(key: string): Promise<T[] | null> {
    const client = await this.getClient();
    try {
      const value = await client.get(`array:${key}`);
      if (!value) return null;
      return JSON.parse(value) as T[];
    } catch (error) {
      Logger.error(`Error retrieving array data from Redis: ${error}`);
      return null;
    }
  }

  // Save hash data in Redis
  public static async saveHashData(key: string, field: string, data: any): Promise<void> {
    const client = await this.getClient();
    try {
      await client.hSet(`hash:${key}`, field, JSON.stringify(data));
    } catch (error) {
      Logger.error(`Error saving hash data to Redis: ${error}`);
      throw error;
    }
  }

  // Retrieve hash data from Redis
  public static async getHashData<T>(key: string, field: string): Promise<T | null> {
    const client = await this.getClient();
    try {
      const value = await client.hGet(`hash:${key}`, field);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      Logger.error(`Error retrieving hash data from Redis: ${error}`);
      return null;
    }
  }

  // For backward compatibility
  public static async saveEntityIds(key: string, ids: number[]): Promise<void> {
    return this.saveArrayData(key, ids);
  }

  public static async getEntityIds(key: string): Promise<number[] | null> {
    return this.getArrayData<number>(key);
  }
}
