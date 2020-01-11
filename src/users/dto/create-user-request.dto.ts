import { IsDefined } from 'class-validator';

/**
 * Represents a request for a new user in the API.
 */
export class CreateUserRequestDto {
  @IsDefined()
  readonly username: string;

  @IsDefined()
  readonly password: string;
}
