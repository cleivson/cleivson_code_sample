import { UnauthorizedException } from '@nestjs/common';

/**
 * Thrown when an user tries to login but his/her e-mail was not verified yet.
 */
export class UnverifiedEmailException extends UnauthorizedException {
  constructor() {
    super('E-mail not verified');
  }
}
