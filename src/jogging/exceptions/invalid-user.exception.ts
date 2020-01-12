import { UnprocessableEntityException } from '@nestjs/common';

/**
 * Thrown when user tried to register a jogging entry with an inexistent user.
 */
export class InvalidUserException extends UnprocessableEntityException {
  constructor() {
    super('The related user does not exist.');
  }
}
