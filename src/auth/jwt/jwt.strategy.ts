import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from 'config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { LoggedUserDto } from 'users';
import { TokenPayload } from './dto';
import { JWT_SECRET_CONFIG_KEY } from './jwt.constants';
import { JwtPassportService } from './jwt.service';

/**
 * Implementation of the {@link @nestjs/passport:PassportStrategy | PassportStrategy} using a Jwt authentication strategy.
 */
@Injectable()
export class JwtPassportStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService,
              private readonly jwtService: JwtPassportService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get(JWT_SECRET_CONFIG_KEY),
    });
  }

  /**
   * Checks if a bearer token is still valid and authenticates the user in the API.
   *
   * @param payload - The deserialized payload of the Bearer token.
   * @returns The equivalent user of the token payload.
   */
  async validate(payload: TokenPayload): Promise<LoggedUserDto> {
    return this.jwtService.parseToken(payload);
  }
}
