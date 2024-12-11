/**
 * Repository class to save convert, save and retrieve roles from Redis.
 */
import { ParsedRole, SupersetRole } from "../types/role";
import fs from "fs";
import csv from "csv-parser";
import { RedisService } from "./redis-util";
import { Logger } from '../utils/logger';

export class RoleRepository {

  /**
   * Persist roles in Redis with the CHU code as the key
   * @param roles Formatted version of Superset Role
   */
  public async saveRoles(roles: ParsedRole[]) {
    try {
      for (const role of roles) {
        await RedisService.saveHashData(role.code, 'role', role.role);
      }
      Logger.info(`${roles.length} Roles saved to Redis successfully.`);
    } catch (error) {
      Logger.error(`Error saving roles to Redis: ${error}`);
      throw error;
    }
  }

  /**
   * Fetch roles from Redis
   */
  public async fetchRoles(): Promise<ParsedRole[]> {
    const redisClient = await RedisService.getClient();
    const roles: ParsedRole[] = [];

    try {
      const keys = await redisClient.keys('hash:*');

      for (const key of keys) {
        const roleData = await RedisService.getHashData<SupersetRole>(key.replace('hash:', ''), 'role');
        if (roleData) {
          roles.push({
            code: key.replace('hash:', ''),
            role: roleData,
          });
        }
      }

      return roles;
    } catch (error) {
      Logger.error(`Error fetching roles from Redis: ${error}`);
      throw error;
    }
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
