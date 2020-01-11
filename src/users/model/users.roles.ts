/**
 * Defines the roles an user can assume in the API.
 */
export enum UserRoles {
  /**
   * Regular user of the API.
   */
  User = 'User',
  /**
   * User that can manage other users.
   */
  UserManager = 'UserManager',
  /**
   * User that can manage everything in the API.
   */
  Admin = 'Admin',
}
