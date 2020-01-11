import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { BasicStrategy } from 'passport-http';
import { LoggedUserDto, UsersService } from 'users';

/**
 * Implementation of the {@link @nestjs/passport:PassportStrategy | PassportStrategy} using a Local authentication strategy.
 */
@Injectable()
export class BasicPassportStrategy extends PassportStrategy(BasicStrategy) {
    constructor(private readonly userService: UsersService) {
        super();
    }

    /**
     * Checks if login parameters are valid and returns the equivalent logged in user.
     *
     * @param username - The username to be used for authentication.
     * @param password - The plain text password to be used for authentication.
     * @returns The equivalent user of the token payload.
     */
    async validate(username: string, password: string): Promise<LoggedUserDto> {
        const user = await this.userService.findOne({ username });

        if (!user || !(await this.userService.verifyPassword(password, user))) {
            throw new UnauthorizedException();
        }

        return { id: user.id, username: user.username, role: user.role };
    }
}
