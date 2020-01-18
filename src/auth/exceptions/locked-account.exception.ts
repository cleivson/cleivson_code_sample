import { UnauthorizedException } from '@nestjs/common';

/**
 * Thrown when an user tries to login but the account is locked.
 */
export class LockedAccountException extends UnauthorizedException {
  constructor() {
    super('Account locked');
  }
}
