import { Test, TestingModule } from '@nestjs/testing';
import { JwtPassportService, JwtStrategyModule } from 'auth/jwt';
import { capture, instance, mock, spy, when } from 'ts-mockito';
import { LoggedUserDto, UserRoles, UsersService } from 'users';
import { AccountController } from './account.controller';
import { CreateUserRequestDto } from './dto';
import { LockedAccountException, UnverifiedEmailException } from './exceptions';
import { MailTemplateService } from './mail-template';
import { VerificationService } from './verification.service';

describe('Account Controller', () => {
  let controller: AccountController;
  let usersServiceMock: UsersService;
  let jwtServiceSpy: JwtPassportService;
  let mailServiceMock: MailTemplateService;
  let verificationServiceMock: VerificationService;

  beforeEach(async () => {
    usersServiceMock = mock<UsersService>(UsersService);
    mailServiceMock = mock<MailTemplateService>(MailTemplateService);
    verificationServiceMock = mock<VerificationService>(VerificationService);

    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtStrategyModule],
      controllers: [AccountController],
      providers: [
        {
          provide: VerificationService,
          useValue: instance(verificationServiceMock),
        },
        {
          provide: UsersService,
          useValue: instance(usersServiceMock),
        },
        {
          provide: MailTemplateService,
          useValue: instance(mailServiceMock),
        }],
    }).compile();

    controller = module.get<AccountController>(AccountController);
    jwtServiceSpy = spy(module.get<JwtPassportService>(JwtPassportService));
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register user in UsersService', () => {
      const expectedDto: CreateUserRequestDto = { email: 'test', password: 'password' };

      controller.register(undefined, expectedDto);

      const [, actualDto] = capture(usersServiceMock.createOne).last();

      expect(actualDto).toEqual(expectedDto);
    });
  });

  describe('login', () => {
    let loginUser: LoggedUserDto;
    beforeEach(() => {
      loginUser = { email: 'user', locked: false, verified: true, role: UserRoles.User };
    });

    describe('with unverified user', () => {
      beforeEach(() => {
        loginUser = { ...loginUser, verified: false };
      });

      it('should throw UnverifiedEmailException', async () => {
        await expect(controller.login({ user: loginUser })).rejects.toThrowError(UnverifiedEmailException);
      });
    });

    describe('with locked user', () => {
      beforeEach(() => {
        loginUser = { ...loginUser, locked: true };
      });

      it('should throw LockedAccountException', async () => {
        await expect(controller.login({ user: loginUser })).rejects.toThrowError(LockedAccountException);
      });
    });

    describe('with valid user', () => {
      it('should return generated token for logged user', async () => {
        const bearerToken = 'token';

        when(jwtServiceSpy.generateToken(loginUser)).thenResolve({ access_token: bearerToken });

        const loginResult = await controller.login({ user: loginUser });

        expect(loginResult.access_token).toEqual(bearerToken);
      });
    });
  });
});
