import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoggedUserDto } from 'users';
import { ConfigService } from '../../config';
import { TokenPayload } from './dto';
import { JWT_TOKEN_EXPIRATION_CONFIG_KEY } from './jwt.constants';

/**
 * Service class that provides the manipulation services related to the Jwt authentication strategy.
 */
@Injectable()
export class JwtPassportService {
  private readonly expirationTime: string;

  constructor(private readonly jwtService: JwtService,
              configService: ConfigService) {
    this.expirationTime = configService.get(JWT_TOKEN_EXPIRATION_CONFIG_KEY);
  }

  /**
   * Generates a Jwt token to be used to authenticate the user into the API in future calls.
   *
   * @param user - The logged user that must be associated with the generated Bearer token.
   * @returns The signed bearer token to be used to authenticate into future calls of the API.
   */
  generateToken(user: LoggedUserDto) {
    const payload: TokenPayload = { username: user.email, sub: user.id };

    const signedToken = this.jwtService.sign(payload);

    return {
      access_token: signedToken,
      token_type: 'Bearer',
      expires_in: this.expirationTime,
    };
  }
}
