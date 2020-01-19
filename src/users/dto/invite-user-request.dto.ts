import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsEmail } from 'class-validator';

/**
 * Represents a request to invite a new user to the app.
 */
export class InviteUserRequest {
  @ApiProperty()
  @IsDefined()
  @IsEmail()
  email: string;
}
