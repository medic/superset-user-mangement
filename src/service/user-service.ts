/**
 * Class for handling creation of user accounts on Superset
 */

import { AxiosRequestConfig } from "axios";
import { AuthService } from "./auth-service";
import { CSVUser, User } from "../types/user";
import { makeApiRequest } from "../utils/request.utils";

export class UserManager {

  constructor(private readonly authService: AuthService = AuthService.getInstance()) {}

  private generateSupersetUser(csvUser: CSVUser, roles: number[]): User {
    const { first_name, last_name, email, username, password } = csvUser;

    return {
      active: true,
      first_name,
      last_name,
      email,
      username,
      password,
      roles: roles,
    }
  }

  public async createUserOnSuperset(users: User[]){
    const headers = await this.authService.getHeaders();

    for (const user of users){
      const response = await makeApiRequest(
        `/security/users/`,
        this.generateRequest(user, headers)
      );
      console.log(response);
    }
  }

  private generateRequest(user: User, headers: any): AxiosRequestConfig {
    return {
      method: 'POST',
      headers: headers,
      data: user,
    };
  }
}
