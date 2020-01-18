import { IsDefined, IsEmail } from 'class-validator';

/**
 * Represents a request to invite a new user to the app.
 */
export class InviteUserRequest {
  @IsDefined()
  @IsEmail()
  email: string;
}
