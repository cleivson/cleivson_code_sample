import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { LockedAccountException } from 'auth/exceptions';
import { ConfigService } from 'config';
import { BasicStrategy } from 'passport-http';
import { User, UsersService } from 'users';
import { validateUser } from '../validation/login-validation.functions';
import { MAX_NUMBER_OF_LOGIN_ATTEMPTS } from './constants';

const DEFAULT_MAX_ATTEMPTS = 3;

/**
 * Implementation of the {@link @nestjs/passport:PassportStrategy | PassportStrategy} using a Local authentication strategy.
 */
@Injectable()
export class BasicPassportStrategy extends PassportStrategy(BasicStrategy) {
    private readonly maxNumberOfLoginAttempts: number;

    constructor(private readonly usersService: UsersService,
                configService: ConfigService) {
        super();

        const configuredMaxAttempts = Number(configService.get(MAX_NUMBER_OF_LOGIN_ATTEMPTS, true));

        this.maxNumberOfLoginAttempts = !isNaN(configuredMaxAttempts) ? configuredMaxAttempts : DEFAULT_MAX_ATTEMPTS;
    }

    /**
     * Checks if a password meets the password of the user with the equivalent username.
     * @param username The username of the user trying to login.
     * @param passwordToVerify The plain-text password to compare with the password of the user.
     * @returns The logged user if the credentials are valid, undefined otherwise.
     * @throws UnauthorizedException if there is no user with the corresponding username or if the password did not match.
     * @throws LockedAccountException if the account is locked.
     * @throws UnverifiedEmailException if the user did not verify his email yet.
     */
    async validate(username: string, passwordToVerify: string): Promise<User> {
      const user = await this.usersService.findOne({ email: username });

      if (!user) {
        throw new UnauthorizedException();
      }

      if (!await this.usersService.verifyPassword(passwordToVerify, user)) {
        return this.handleLoginFailed(user);
      }

      return this.handleLoginSucceeded(user);
    }

    private async handleLoginSucceeded(user: User) {
      validateUser(user);

      user.incorrectLogins = 0;

      return this.usersService.save(user);
    }

    private async handleLoginFailed(user: User): Promise<User> {
      user.incorrectLogins += 1;

      if (user.incorrectLogins > this.maxNumberOfLoginAttempts) {
        user.locked = true;
      }

      const savedUser = await this.usersService.save(user);

      if (savedUser.locked) {
        throw new LockedAccountException();
      } else {
        throw new UnauthorizedException();
      }
    }
}
