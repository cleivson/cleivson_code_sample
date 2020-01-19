import { NotFoundException } from '@nestjs/common';

/**
 * Thrown when an user tried to verify the email using a token that is not related to him/her.
 */
export class VerificationTokenNotFoundException extends NotFoundException {
  constructor() {
    super('Token not found');
  }
}
