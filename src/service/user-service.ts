/**
 * Class for handling creation of user accounts on Superset
 */

import { AxiosRequestConfig } from "axios";
import { AuthService } from "./auth-service";
import { CreateUserResponse, User } from "../types/user";
import { makeApiRequest } from "../utils/request.utils";
import { Logger } from "../utils/logger";

export class UserService {

  constructor(private readonly authService: AuthService = AuthService.getInstance()) {}

  public async createUserOnSuperset(users: User[]): Promise<CreateUserResponse[]> {
    const headers = await this.authService.getHeaders();

    const createdUsers: CreateUserResponse[] = [];

    for (const user of users){
      const response = await makeApiRequest(
        `/security/users/`,
        this.generateRequest(user, headers)
      );

      const createdUser = response.data as CreateUserResponse;
      Logger.success(`Created user: ${createdUser.result.username}`);

      createdUsers.push(createdUser);
    }

    return createdUsers;
  }

  private generateRequest(user: User, headers: any): AxiosRequestConfig {
    return {
      method: 'POST',
      headers: headers,
      data: user,
    };
  }
}
