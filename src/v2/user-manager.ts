/**
 * Class for handling creation of user accounts on Superset
 */

import { RequestInit } from "node-fetch";
import { AuthManager } from "./auth-manager";
import { CSVUser, User } from "./user.model";

export class UserManager {

  private headers: any;
  private authManager: AuthManager;

  constructor() {
    this.authManager = new AuthManager();
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
