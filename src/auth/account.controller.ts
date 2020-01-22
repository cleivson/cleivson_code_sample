import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, Request, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBasicAuth, ApiBody, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Crud, CrudController, CrudRequest, CrudRequestInterceptor, ParsedRequest } from '@nestjsx/crud';
import { CreateUserRequestDto, User, userFieldsToExcludeFromResponse, UsersService } from 'users';
import { JwtPassportService } from './jwt';

const CONTROLLER_ROUTE = 'account';
const ACCOUNT_VERIFICATION_ROUTE = 'verify';

const VALIDATION_TOKEN_QUERY = 'token';
const VALIDATION_USERMAIL_QUERY = 'userEmail';

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
    exclude: userFieldsToExcludeFromResponse,
  },
  validation: {
    transform: true,
  },
})
@ApiTags('Account')
@Controller(CONTROLLER_ROUTE)
export class AccountController implements CrudController<User> {
  constructor(readonly service: UsersService,
              private readonly jwtService: JwtPassportService) { }

  get base(): CrudController<User> {
    return this;
  }

  @Post('register')
  @UseInterceptors(CrudRequestInterceptor)
  @ApiBody({ type: CreateUserRequestDto })
  async register(@ParsedRequest() req: CrudRequest, @Body() newUser: CreateUserRequestDto): Promise<User> {
    return this.service.createOne(req, newUser);
  }

  @Get(ACCOUNT_VERIFICATION_ROUTE)
  @ApiQuery({ name: VALIDATION_TOKEN_QUERY })
  @ApiQuery({ name: VALIDATION_USERMAIL_QUERY })
  async validate(@Query(VALIDATION_TOKEN_QUERY) token: string, @Query(VALIDATION_USERMAIL_QUERY) userEmail: string) {
    // TODO Test that when an user changes it's email, the account is locked again until confirmation.
    await this.service.validateEmail(token, userEmail);
  }

  /**
   * Authenticates an user into the API using the local username/password strategy.
   *
   * @param req - The HTTP request representation of the API call.
   * @returns A bearer token representing the authenticated user.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('basic'))
  @ApiBasicAuth()
  async login(@Request() req) {
    const user: User = req.user;

    return this.jwtService.generateToken(user);
  }
}
