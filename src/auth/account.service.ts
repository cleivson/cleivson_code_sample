import { Injectable } from '@nestjs/common';
import { CrudRequest } from '@nestjsx/crud';
import { CreateUserRequestDto, User, UsersService } from 'users';
import { LockedAccountException, UnverifiedEmailException } from './exceptions';
import { JwtPassportService } from './jwt';

@Injectable()
export class AccountService {
  constructor(private readonly usersService: UsersService,
              private readonly jwtService: JwtPassportService) { }

  /**
   * Creates a new user.
   * @param newUser The new user trying to register an account.
   * @param req The http request.
   */
  async register(newUser: CreateUserRequestDto, req: CrudRequest): Promise<void> {
    await this.usersService.createOne(req, newUser);
  }

  /**
   * Validates if a user is able to login and, if so, generates a Bearer token for the user.
   * @param user The user trying to login
   */
  async login(user: User) {
    this.validateUser(user);
    // TODO check return value
    return this.jwtService.generateToken(user);
  }

  async validateEmail(token: string, userEmail: string) {
    await this.usersService.validateEmail(token, userEmail);
  }

  private validateUser(user: User) {
    // TODO Besides testing this check itself, check whether it only gets here after validating the password
    if (!user.verified) {
      throw new UnverifiedEmailException();
    }

    // TODO Besides testing this check itself, check whether it only gets here after validating the password
    if (user.locked) {
      throw new LockedAccountException();
    }
  }
}
