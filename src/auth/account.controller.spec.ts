import { Test, TestingModule } from '@nestjs/testing';
import { capture, instance, mock, when } from 'ts-mockito';
import { CreateUserRequestDto, LoggedUserDto, UserRoles, UsersService } from 'users';
import { AccountController } from './account.controller';
import { JwtPassportService } from './jwt';

describe('Account Controller', () => {
  let controller: AccountController;
  let usersServiceMock: UsersService;
  let jwtServiceMock: JwtPassportService;

  beforeEach(async () => {
    usersServiceMock = mock<UsersService>(UsersService);
    jwtServiceMock = mock<JwtPassportService>(JwtPassportService);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountController],
      providers: [
        {
          provide: UsersService,
          useValue: instance(usersServiceMock),
        },
        {
          provide: JwtPassportService,
          useValue: instance(jwtServiceMock),
        },
      ],
    }).compile();

    controller = module.get<AccountController>(AccountController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register user in UsersService', () => {
      const expectedDto: CreateUserRequestDto = { email: 'test', password: 'password', firstName: 'User', lastName: 'Test' };

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

    describe('with valid user', () => {
      it('should return generated token for logged user', async () => {
        const bearerToken = 'token';

        when(jwtServiceMock.generateToken(loginUser)).thenReturn({ access_token: bearerToken, token_type: 'Bearer', expires_in: '1d' });

        const loginResult = await controller.login({ user: loginUser });

        expect(loginResult.access_token).toEqual(bearerToken);
      });
    });
  });
});
