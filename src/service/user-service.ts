/**
 * Class for handling creation of user accounts on Superset
 */

import rison from "rison";
import { CreateUserResponse, SupersetUser, User } from "../types/user";
import { Logger } from "../utils/logger";
import { API_URL, handleRequest } from '../utils/request.utils';

export class UserService {

  constructor() {}

  public async createUserOnSuperset(users: User[]): Promise<CreateUserResponse[]> {
    const createdUsers: CreateUserResponse[] = [];

    for (const user of users) {
      try {
        const response = await handleRequest(`${API_URL()}/security/users/`, {
          method: 'POST',
          body: JSON.stringify(user)
        }) as CreateUserResponse;

        Logger.success(`Created user: ${JSON.stringify(response, null, 2)}`);
        createdUsers.push({result: user});
      } catch (error) {
        if (error instanceof Error && error.message.includes('status: 422')) {
          Logger.info(`User ${user.username} already exists, updating roles instead`);

          const existingUser = await this.getUserByEmail(user.email);
          Logger.info(`Fetched ${JSON.stringify(existingUser, null, 2)} from Superset`);

          const updatedUser = await this.updateUser({
            active: existingUser.active,
            first_name: existingUser.first_name,
            last_name: existingUser.last_name,
            email: existingUser.email,
            username: existingUser.username,
            roles: user.roles,
            password: user.password
          }, existingUser.id)

          createdUsers.push(updatedUser);
          continue;
        } else {
          Logger.error(`Failed to create user ${user.username}: ${error}`);
          throw error;
        }
      }
    }

    return createdUsers;
  }

  public async getUserByEmail(email: string): Promise<SupersetUser> {
    try {
      const filters = {
        filters: [{
          col: "email",
          opr: "eq",
          value: email
        }]
      };

      const risonQuery = rison.encode(filters);

      const response = await handleRequest(`${API_URL()}/security/users/?q=${risonQuery}`);
      return response.result[0] as SupersetUser;
    } catch (error) {
      Logger.error(`Failed to get user by email ${email}: ${error}`);
      throw error;
    }
  }

  public async updateUser(user: User, userId: number) {
    try {
      const response = await handleRequest(`${API_URL()}/security/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(user)
      }) as CreateUserResponse;

      Logger.success(`Updated user: ${JSON.stringify(response, null, 2)}`);
      return response;
    } catch (error) {
      Logger.error(`Failed to update user ${userId}: ${error}`);
      throw error;
    }
  }
}
