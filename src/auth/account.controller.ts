import { Body, Controller, Post, Request, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBasicAuth, ApiTags } from '@nestjs/swagger';
import { Crud, CrudController, CrudRequest, CrudRequestInterceptor, ParsedRequest } from '@nestjsx/crud';
import { propertyOf } from 'common';
import { CreateUserRequestDto, User, UsersService } from 'users';
import { JwtPassportService } from './jwt';

@Crud({
  model: {
    type: User,
  },
  dto: {
    create: CreateUserRequestDto,
  },
  routes: {
    exclude: [
      'createManyBase',
      'createOneBase',
      'deleteOneBase',
      'getManyBase',
      'getOneBase',
      'replaceOneBase',
      'updateOneBase',
    ],
  },
  query: {
    exclude: [
      propertyOf<User>('passwordHash'),
    ],
  },
  validation: {
    transform: true,
  },
})
@Controller('account')
@ApiTags('Account')
export class AccountController implements CrudController<User> {
  constructor(readonly service: UsersService,
              private readonly jwtService: JwtPassportService) { }

  get base(): CrudController<User> {
    return this;
  }

  @Post('register')
  @UseInterceptors(CrudRequestInterceptor)
  async register(@ParsedRequest() req: CrudRequest, @Body() newUser: CreateUserRequestDto): Promise<void> {
    await this.service.createOne(req, newUser);
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
