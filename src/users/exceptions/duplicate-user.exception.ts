import { ConflictException } from '@nestjs/common';

/**
 * Thrown when an user is being saved with the same username of a different user.
 */
export class DuplicateUserException extends ConflictException {
  constructor(userName: string) {
    super(`User name ${userName} already exists.`);
  }
}
