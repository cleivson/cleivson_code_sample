import { UserRoles } from 'users';

/**
 * Represents a user logged into the API.
 */
export interface LoggedUserDto {
  /**
   * The name of the logged user.
   */
  username: string;
  /**
   * The identifier of the logged user into the database.
   */
  id: number;
  /**
   * The role of the user in the system.
   */
  role: UserRoles;
}
