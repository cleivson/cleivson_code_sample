import { Test, TestingModule } from '@nestjs/testing';
import { capture, instance, mock, when } from 'ts-mockito';
import { LoggedUserDto, UserRoles, UsersService } from 'users';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { CreateUserRequestDto } from './dto';

describe('Account Controller', () => {
  let controller: AccountController;
  let usersServiceMock: UsersService;
  let accountServiceMock: AccountService;

  beforeEach(async () => {
    accountServiceMock = mock<AccountService>(AccountService);
    usersServiceMock = mock<UsersService>(UsersService);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountController],
      providers: [
        {
          provide: AccountService,
          useValue: instance(accountServiceMock),
        },
        {
          provide: UsersService,
          useValue: instance(usersServiceMock),
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

      const [actualDto] = capture(accountServiceMock.register).last();

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

        when(accountServiceMock.login(loginUser)).thenResolve({ access_token: bearerToken });

        const loginResult = await controller.login({ user: loginUser });

        expect(loginResult.access_token).toEqual(bearerToken);
      });
    });
  });
});
