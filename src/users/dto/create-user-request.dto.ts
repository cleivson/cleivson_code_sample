import { ApiProperty } from '@nestjs/swagger';
import { IsAlpha, IsDefined, IsEmail, IsNotEmpty } from 'class-validator';

/**
 * Represents a request for a new user in the API.
 */
export class CreateUserRequestDto {
  @IsDefined()
  @IsAlpha()
  @ApiProperty()
  firstName: string;

  @IsDefined()
  @IsAlpha()
  @ApiProperty()
  lastName: string;

  @IsDefined()
  @IsEmail()
  @ApiProperty()
  readonly email: string;

  @IsDefined()
  @IsNotEmpty()
  @ApiProperty()
  readonly password: string;
}
