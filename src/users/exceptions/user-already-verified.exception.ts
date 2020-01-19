import { UnauthorizedException } from '@nestjs/common';

/**
 * Throw when an user tried to validate the email but it was already validated.
 */
export class UserAlreadyVerifiedException extends UnauthorizedException {
  constructor() {
    super('E-mail already verified');
  }
}
