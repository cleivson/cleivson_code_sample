import { Body, Controller, Get, Post, Query, Request, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBasicAuth, ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Crud, CrudController, CrudRequest, CrudRequestInterceptor, ParsedRequest } from '@nestjsx/crud';
import { MailTemplateService } from 'auth/mail-template';
import { propertyOf } from 'common';
import { ConfigService } from 'config';
import * as url from 'url';
import { Roles, RolesGuard, User, UserRoles, UsersService } from 'users';
import { PUBLIC_CLIENT_URL, PUBLIC_SERVER_URL } from './auth.constants';
import { CreateUserRequestDto, InviteUserRequest } from './dto';
import { LockedAccountException, UnverifiedEmailException } from './exceptions';
import { JwtPassportService } from './jwt';
import { VerificationToken } from './model';
import { VerificationService } from './verification.service';

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
    exclude: [
      propertyOf<User>('passwordHash'),
    ],
  },
  validation: {
    transform: true,
  },
})
@ApiTags('Account')
@Controller(CONTROLLER_ROUTE)
export class AccountController implements CrudController<User> {
  private publicServerUrl: string;
  private publicClientUrl: string;

  constructor(readonly service: UsersService,
              private readonly jwtService: JwtPassportService,
              private readonly mailService: MailTemplateService,
              private readonly verificationService: VerificationService,
              configService: ConfigService) {

    this.publicServerUrl = configService.get(PUBLIC_SERVER_URL);
    this.publicClientUrl = configService.get(PUBLIC_CLIENT_URL);
  }

  get base(): CrudController<User> {
    return this;
  }

  @Post('register')
  @UseInterceptors(CrudRequestInterceptor)
  async register(@ParsedRequest() req: CrudRequest, @Body() newUser: CreateUserRequestDto): Promise<void> {
    const createdUser = await this.service.createOne(req, newUser);

    const verificationToken: VerificationToken = await this.verificationService.createVerificationToken(createdUser);

    await this.sendVerificationMail(verificationToken, createdUser);
  }

  @Get(ACCOUNT_VERIFICATION_ROUTE)
  async validate(@Query(VALIDATION_TOKEN_QUERY) token: string, @Query(VALIDATION_USERMAIL_QUERY) userEmail: string) {
    // TODO Test that when an user changes it's email, the account is locked again until confirmation.
    await this.verificationService.validateToken(token, userEmail);
  }

  @Post('/invite')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRoles.Admin)
  @ApiBearerAuth()
  @ApiQuery({ name: 'email' })
  async invite(@Query() inviteRequest: InviteUserRequest) {
    const accountCreationUrl = this.getAccountCreationUrl();

    await this.mailService.sendInvitationMail(inviteRequest.email, accountCreationUrl);
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
    const user: User = req.user;

    this.validateUser(user);

    // TODO check return value
    return this.jwtService.generateToken(req.user);
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

  private getAccountCreationUrl(): string {
    const urlObject: url.UrlObject = {
      host: this.publicClientUrl,
      pathname: '/api/#/Account/login',
    };

    const accountCreationUrl = url.format(urlObject);

    return accountCreationUrl;
  }

  private async sendVerificationMail(verificationToken: VerificationToken, createdUser: User) {
    const validationUrl = this.getValidationUrl(verificationToken, createdUser);

    await this.mailService.sendAccountValidationMail(createdUser, validationUrl);
  }

  private getValidationUrl(verificationToken: VerificationToken, user: User): string {
    const urlObject: url.UrlObject = {
      host: this.publicServerUrl,
      pathname: `/${CONTROLLER_ROUTE}/${ACCOUNT_VERIFICATION_ROUTE}`,
      query: { [VALIDATION_TOKEN_QUERY]: verificationToken.token, [VALIDATION_USERMAIL_QUERY]: user.email },
    };

    return url.format(urlObject);
  }
}
