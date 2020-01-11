import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBasicAuth, ApiTags } from '@nestjs/swagger';
import { JwtPassportService } from 'auth/jwt';
import { CreateUserRequestDto, UsersService } from 'users';

@Controller('auth')
@ApiTags('Auth')
export class BasicAuthenticationController {
  constructor(private readonly usersService: UsersService,
              private readonly jwtService: JwtPassportService) { }

  @Post('register')
  async register(@Body() newUser: CreateUserRequestDto): Promise<void> {
    await this.usersService.registerUser(newUser);
  }

  /**
   * Authenticates an user into the API using the local username/password strategy.
   *
   * @param req - The HTTP request representation of the API call.
   * @returns A bearer token representing the authenticated user.
   */
  @ApiBasicAuth()
  @UseGuards(AuthGuard('basic'))
  @Post('login')
  async login(@Request() req) {
    // TODO return more than just the token. Return info about the user
    return this.jwtService.generateToken(req.user);
  }
}
