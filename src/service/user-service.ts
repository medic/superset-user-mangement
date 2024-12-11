/**
 * Class for handling creation of user accounts on Superset
 */

import { AuthService } from "./auth-service";
import { CreateUserResponse, User } from "../types/user";
import { Logger } from "../utils/logger";
import { API_URL, fetchWithAuth } from '../utils/request.utils';

export class UserService {

  constructor() {}

  public async createUserOnSuperset(users: User[]): Promise<CreateUserResponse[]> {
    const createdUsers: CreateUserResponse[] = [];

    for (const user of users) {
      try {
        const response = await fetchWithAuth(`${API_URL()}/security/users/`, {
          method: 'POST',
          body: JSON.stringify(user)
        }) as CreateUserResponse;

        Logger.success(`Created user: ${JSON.stringify(response, null, 2)}`);
        createdUsers.push({ result: user });
      } catch (error) {
        if (error instanceof Error && error.message.includes('status: 422')) {
          Logger.info(`User ${user.username} already exists, skipping creation`);
          createdUsers.push({ result: user });
          continue;
        } else {
          Logger.error(`Failed to create user ${user.username}: ${error}`);
          throw error;
        }
      }
    }

    return createdUsers;
  }

}
