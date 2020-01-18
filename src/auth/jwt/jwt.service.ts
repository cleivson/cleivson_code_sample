import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoggedUserDto } from 'users';
import { TokenPayload } from './dto';

/**
 * Service class that provides the manipulation services related to the Jwt authentication strategy.
 */
@Injectable()
export class JwtPassportService {
  constructor(private readonly jwtService: JwtService) { }

  /**
   * Generates a Jwt token to be used to authenticate the user into the API in future calls.
   *
   * @param user - The logged user that must be associated with the generated Bearer token.
   * @returns The signed bearer token to be used to authenticate into future calls of the API.
   */
  async generateToken(user: LoggedUserDto) {
    const payload: TokenPayload = { username: user.email, sub: user };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  /**
   * Parses a Jwt deserialized content into a logged in user.
   *
   * @param tokenPayload - The deserialized payload of a Jwt token used to authenticate the user.
   * @returns The representation of a user logged in the API.
   */
  parseToken(tokenPayload: TokenPayload): LoggedUserDto {
    return tokenPayload.sub;
  }
}
