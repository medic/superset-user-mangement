/**
 * Class for handling creation of user accounts on Superset
 */

import { RequestInit } from "node-fetch";
import { AuthService } from "./auth-service";
import { CSVUser, User } from "../model/user.model";

export class UserManager {

  private headers: any;
  private authManager: AuthService;

  constructor() {
    this.authManager = new AuthService();
    this.headers = null;
  }

  private async initHeaders() {
    if (!this.headers) {
      this.headers = await this.authManager.getHeaders();
    }
  }

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
    await this.initHeaders();

    for (const user of users){
      const response = await this.authManager.fetchRequest(
        `/security/users/`,
        this.generateRequest(user)
      );
      console.log(response);
    }
  }

  private generateRequest(user: User) {
    const request: RequestInit = {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(user),
    };

    return request;
  }
}
