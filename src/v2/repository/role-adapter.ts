/**
 * Helper functions to manipulate SupersetRoles
 */

import { SupersetRole, ParsedRole } from '../model/role.model';

export class RoleAdapter {
  constructor() {}

  /**
   * Converts SupersetRole into ParsedRole after extraction of CHU Code
   * @param SupersetRole
   * @returns @param ParsedRole
   */
  public async toParsedRole(supersetRoles: SupersetRole[]) {
    const parsedRoles: ParsedRole[] = [];

    for (const role of supersetRoles) {
      const key = this.extractCHUCode(role.name);
      if (key) {
        console.log(key);
        parsedRoles.push({ code: key, role: role });
      }
    }

    return parsedRoles;
  }

  /**
   * Role names come in a 6-digit prefix followed by the name of the chu
   * This function extracts the CHU code
   */
  private extractCHUCode(roleName: string): string | null {
    const chuCode = RegExp(/\d{6}/).exec(roleName); //match any 6 consecutive digits
    return chuCode ? chuCode[0] : null;
  }

  /**
   * Match the CHA wth the stored SupersetRole.
   * CHA details are extracted from supplied CSV
   * @param supersetRoles Role as defined in Superset
   * @param place string of CHU codes as supplied by CHAs
   * @returns List of roles to be assigned to CHA
   */
  public getCHARoles(
    supersetRoles: SupersetRole[],
    place: string,
  ): SupersetRole[] {
    let roles: SupersetRole[] = [];

    console.log(place);

    if (place.includes(',')) {
      const places = place.split(',');

      places.forEach((place) => {
        place = place.trim();
        roles.push(...this.filterCHARoles(supersetRoles, place));
      });
    } else {
      roles = this.filterCHARoles(supersetRoles, place);
    }

    return roles;
  }

  /**
   *
   * @param roles fetched SupersetRoles
   * @param searchString 6 digit chu code as reported by CHA
   * @returns Roles matching the 6 digit code provided
   */
  public filterCHARoles(
    roles: SupersetRole[],
    searchString: string,
  ): SupersetRole[] {
    const escapedSearchString = this.escapeRegExp(searchString);
    const regexPattern = new RegExp(`^${escapedSearchString}_`, 'i');

    return roles.filter((supersetRole) => regexPattern.test(supersetRole.name));
  }

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
