import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsEmail } from 'class-validator';
import { Column } from 'typeorm';

/**
 * Represents a request for a new user in the API.
 */
export class CreateUserRequestDto {
  @IsDefined()
  @ApiProperty()
  firstName: string;

  @Column()
  @IsDefined()
  @ApiProperty()
  lastName: string;

  @IsDefined()
  @IsEmail()
  @ApiProperty()
  readonly email: string;

  @IsDefined()
  @ApiProperty()
  readonly password: string;
}
