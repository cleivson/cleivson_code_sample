import { ApiProperty } from '@nestjs/swagger';

/**
 * Transfer object for the profile picture of an user.
 */
export class ProfilePictureDto {
  /**
   * The binary file representing the profile picture.
   */
  @ApiProperty({ type: 'string', format: 'binary' })
  picture: Buffer;
}
