import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, Request, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBasicAuth, ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Crud, CrudController, CrudRequest, CrudRequestInterceptor, ParsedRequest } from '@nestjsx/crud';
import { CreateUserRequestDto, User, userFieldsToExcludeFromResponse, UsersService } from 'users';
import { JwtPassportService, LoginResponse } from './jwt';

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
  @ApiOperation({ summary: 'Public User registration' })
  @ApiBody({ type: CreateUserRequestDto })
  @ApiResponse({ status: HttpStatus.CREATED, type: User })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'The e-mail is already registered.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'The information about the user is invalid.' })
  async register(@ParsedRequest() req: CrudRequest, @Body() newUser: CreateUserRequestDto): Promise<User> {
    return this.service.createOne(req, newUser);
  }

  @ApiOperation({ summary: 'Verify User e-mail' })
  @Get(ACCOUNT_VERIFICATION_ROUTE)
  @ApiQuery({ name: VALIDATION_TOKEN_QUERY })
  @ApiQuery({ name: VALIDATION_USERMAIL_QUERY })
  @ApiResponse({ status: HttpStatus.OK, description: 'E-mail verified.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'The user does not exist or is not associated to the given token.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'The token is expired or user is already verified.' })
  async validate(@Query(VALIDATION_TOKEN_QUERY) token: string, @Query(VALIDATION_USERMAIL_QUERY) userEmail: string) {
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
  @ApiOperation({ summary: 'Basic Authentication Login of an User' })
  @ApiResponse({ status: HttpStatus.OK, type: LoginResponse })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'The credentials are incorrect, the user does not exist or account is locked/unverified' })
  @ApiBasicAuth()
  async login(@Request() req) {
    const user: User = req.user;

    return this.jwtService.generateToken(user);
  }
}
