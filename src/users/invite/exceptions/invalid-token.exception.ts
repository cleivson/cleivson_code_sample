import { UnauthorizedException } from '@nestjs/common';

/**
 * Thrown when an user tried to accept an invite with an invalid token.
 */
export class InvalidTokenException extends UnauthorizedException {
  constructor() {
    super('Token is not valid.');
  }
}
