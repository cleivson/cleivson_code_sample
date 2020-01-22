import { ApiProperty } from '@nestjs/swagger';

export class LoginResponse {
  /**
   * The generated token to be used for authenticated requests.
   */
  @ApiProperty({ description: 'The generated token to be used for authenticated requests.' })
  accessToken: string;

  /**
   * The type of the token to be sent in the Authorization header.
   */
  @ApiProperty({ description: 'The type of the token to be sent in the Authorization header.' })
  tokenType: string;

  /**
   * Token expiration description.
   */
  @ApiProperty({ description: 'Token expiration description.' })
  expiresIn: string;
}
