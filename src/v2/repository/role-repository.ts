/**
 * Helper class to save convert, save and retrieve roles from Redis.
 */

import {createClient, RedisClientType} from "redis";
import {ParsedRole, SupersetRole} from "../model/role.model";
import fs from "fs";
import csv from "csv-parser";

export class RoleRepository {
  private readonly redisClient: RedisClientType;
  private isConnected: boolean = false;

  constructor() {
    this.redisClient = createClient();
    this.redisClient.on('error', (err) =>
      console.log('Redis Client Error', err),
    );
  }

  private async connectRedis() {
    if (!this.isConnected) {
      await this.redisClient.connect();
      this.isConnected = true;
    }
  }

  private async closeRedis() {
    if (this.isConnected) {
      try {
        await this.redisClient.disconnect();
        this.isConnected = false;
        console.log('Redis client disconnected successfully.');
      } catch (disconnectError) {
        console.error('Error disconnecting Redis client:', disconnectError);
      }
    }
  }

  /**
   * Persist roles in Redis with the CHU code as the key
   * @param roles Formatted version of Superset Role
   */
  public async saveRoles(roles: ParsedRole[]) {
    await this.connectRedis();

    try {
      for (const role of roles) {
        await this.redisClient.hSet(
          role.code,
          'role',
          JSON.stringify(role.role),
        );
      }
      console.log(`${roles.length} Roles saved to Redis successfully.`);
    } catch (error) {
      console.error('Error saving roles to Redis:', error);
      throw error;
    } finally {
      await this.closeRedis();
    }
  }

  /**
   * Fetch roles from Redis
   */
  public async fetchRoles(): Promise<ParsedRole[]> {
    await this.connectRedis();
    const roles: ParsedRole[] = [];

    try {
      const keys = await this.redisClient.keys('*');
      

      for (const key of keys){
        const role = await this.redisClient.hGet(key, 'role');
        const supersetRole = this.parseRoleString(role);

        if (supersetRole) {
          roles.push({ code: key, role: supersetRole });
        }
      }
    } catch (error) {
      console.error('Error reading from Redis:', error);
      throw error;
    } finally {
      await this.closeRedis();
    }

    return roles;
  }

  /**
   * Converter for persisted role (string) to @property SupersetRole
   * @param roleString
   * @returns @property SupersetRole
   */
  private parseRoleString(
    roleString: string | undefined,
  ): SupersetRole | undefined {
    if (roleString) {
      // Type guard to ensure roleString is not undefined
      try {
        return JSON.parse(roleString);
      } catch (error) {
        console.error('Error parsing JSON string:', error);
        return undefined;
      }
    } else {
      console.error('jsonString is undefined');
      return undefined;
    }
  }

  /**
   * Optional function to write roles to CSV instead of persisting to Redis.
   * @param roles Stringified version of Superset Role
   * @param filePath URI to the CSV file to write to
   */
  async writeRolesToCSV(roles: ParsedRole[], filePath: string) {
    const fileExists = fs.existsSync(filePath);

    const header = 'code,role\n';

    const stream = fs.createWriteStream(filePath, {
      flags: fileExists ? 'a' : 'w',
    });

    // If the file is empty or does not exist, write the header
    if (!fileExists || fs.statSync(filePath).size === 0) {
      stream.write(header);
    }

    roles.forEach((pRole) => {
      const { code, role } = pRole;
      stream.write(`${code},${JSON.stringify(role)}\n`);
    });

    stream.end();
  }

  /**
   * Read from CSV containing Superset roles. This file will be loaded to Redis for easier access.
   * @param filePath CSV file with the Superset Roles
   */
  public async readFromFile(filePath: string) {
    const parsedRoles: ParsedRole[] = [];

    fs.createReadStream(filePath)
      .on('error', () => {
        throw new Error('File not found');
      })
      .pipe(csv())
      .on('data', (data: ParsedRole) => {
        parsedRoles.push(data);
      })
      .on('error', (error: Error) => {
        console.log(error.message);
      })
      .on('end', () => {
        console.log(parsedRoles);
        console.log(`Processed ${parsedRoles.length} successfully`);
      });
  }
}
