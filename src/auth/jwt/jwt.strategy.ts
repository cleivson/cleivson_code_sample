import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from 'config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { LoggedUserDto, UsersService } from 'users';
import { validateUser } from '../validation/login-validation.functions';
import { TokenPayload } from './dto';
import { JWT_SECRET_CONFIG_KEY } from './jwt.constants';
import { JwtPassportService } from './jwt.service';

/**
 * Implementation of the {@link @nestjs/passport:PassportStrategy | PassportStrategy} using a Jwt authentication strategy.
 */
@Injectable()
export class JwtPassportStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService,
              private readonly jwtService: JwtPassportService,
              private readonly usersService: UsersService) {
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
    const userId = payload.sub;

    const persistedUser = await this.usersService.findOne(userId);

    // The user to whom the token was issued doesn't exist anymore or had it's username changed
    if (!persistedUser || persistedUser.email !== payload.username) {
      throw new UnauthorizedException();
    }

    validateUser(persistedUser);

    const { passwordHash, ...loggedUser } = persistedUser;

    return loggedUser;
  }
}
