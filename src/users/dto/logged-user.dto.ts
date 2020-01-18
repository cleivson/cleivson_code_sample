import { User } from '../model';

/**
 * Represents a user logged into the API.
 */
export interface LoggedUserDto extends Omit<Omit<User, 'password'>, 'passwordHash'> {
}
