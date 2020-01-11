import { ConflictException } from '@nestjs/common';

export class DuplicateUserException extends ConflictException {
  constructor(userName: string) {
    super(`User name ${userName} already exists.`);
  }
}
