import { UnauthorizedException } from '@nestjs/common';

/**
 * Thrown when an user tried to verify an email using a token that was already expired.
 */
export class VerificationTokenExpiredException extends UnauthorizedException {
  constructor() {
    super('Token expired');
  }
}
