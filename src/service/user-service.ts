/**
 * Class for handling creation of user accounts on Superset
 */

import { AuthService } from "./auth-service";
import { CreateUserResponse, User } from "../types/user";
import { Logger } from "../utils/logger";
import { API_URL, fetchWithAuth } from '../utils/request.utils';

export class UserService {

  constructor(private readonly authService: AuthService = AuthService.getInstance()) {}

  public async createUserOnSuperset(users: User[]): Promise<CreateUserResponse[]> {
    const createdUsers: CreateUserResponse[] = [];

    for (const user of users){
      try {
        const createdUser = await fetchWithAuth(`${API_URL()}/security/users/`, {
          method: 'POST',
          body: JSON.stringify(user)
        }) as CreateUserResponse;

        Logger.success(`Created user: ${createdUser.result.username}`);

        createdUsers.push(createdUser);
      } catch (error) {
        // You might want to add error handling here
        Logger.error(`Error creating user ${user.username}: ${error}`);
      }
    }

    return createdUsers;
  }

}
