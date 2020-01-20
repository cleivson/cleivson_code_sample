import { ApiProperty } from '@nestjs/swagger';
import { IsAlpha, IsDefined, IsJWT, IsNotEmpty } from 'class-validator';

export class AcceptInviteRequest {
  @IsDefined()
  @IsAlpha()
  @ApiProperty()
  firstName: string;

  @IsDefined()
  @IsAlpha()
  @ApiProperty()
  lastName: string;

  @IsDefined()
  @IsNotEmpty()
  @ApiProperty()
  readonly password: string;

  @IsDefined()
  @IsJWT()
  @ApiProperty()
  token: string;
}
