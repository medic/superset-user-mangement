/**
 * Repository class to save convert, save and retrieve RLS policies from Redis.
 */
import {RLSEntity, RowLevelSecurity} from "../types/rls";
import {RedisService} from "./redis-util";

export class RlsRepository {

  /**
   * Persist rls policies with the id as the key
   * @Params rlsEntity formatted version of the RLS Entity
   */
  async saveRLSPolicies(rlsEntities: RLSEntity[]) {
    if (rlsEntities.length === 0) {
      return;
    }

    const redisClient = await RedisService.getClient();

    try {
      for (const entity of rlsEntities) {
        await redisClient.hSet(entity.id.toString(), 'rls', JSON.stringify(entity.rls));
      }
    } catch (error) {
      console.error('Error saving RLS policies:', error);
      throw error;
    } finally {
      // Ensure the Redis connection is closed properly
      await redisClient.disconnect();
    }
  }

  /**
   * Fetch policies from Redis
   */
  async fetchRoles(): Promise<RLSEntity[]> {
    const redisClient = await RedisService.getClient();
    const rlsEntities: RLSEntity[] = []

    try {
      const keys = await redisClient.keys('*')

      for (const key of keys) {
        const rlsEntity = await redisClient.hGet(key, 'rls');
        const rlsPolicy = this.parseRLSEntity(rlsEntity);

        if(rlsPolicy) {
          rlsEntities.push({ id: parseInt(key), rls : rlsPolicy})
        }
      }
    } catch (error) {
      console.error('Error reading from Redis:', error);
      throw error;
    } finally {
      await redisClient.disconnect()
    }

    return rlsEntities;
  }

  /**
   * Converter for persisted RLS (string) to @property RLSEntity
   * @param rlsEntity
   * @returns RowLevelSecurity
   */
  private parseRLSEntity(rlsEntity: string | undefined): RowLevelSecurity | undefined {
    if (rlsEntity) {
      // Type guard to ensure roleString is not undefined
      try {
        return JSON.parse(rlsEntity);
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
   * Converts SupersetRole into ParsedRole after extraction of CHU Code
   * @returns
   * @param policies
   */
  public toRLSEntity(policies: RowLevelSecurity[]): RLSEntity[] {
    return policies.map((policy) => {
      return {
        id: policy.id,
        rls: policy
      }
    })
  }

  /**
   * Fetch policies from Redis
   */
  async fetchRLSPolicies(): Promise<RLSEntity[]> {
    const rlsRepo = new RlsRepository()
    return rlsRepo.fetchRLSPolicies()
  }

}
