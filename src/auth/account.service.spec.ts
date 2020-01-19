import { Test, TestingModule } from '@nestjs/testing';
import { capture, instance, mock, spy, when } from 'ts-mockito';
import { LoggedUserDto, UserRoles, UsersService } from 'users';
import { AccountService } from './account.service';
import { CreateUserRequestDto } from './dto';
import { LockedAccountException, UnverifiedEmailException } from './exceptions';
import { JwtPassportService, JwtStrategyModule } from './jwt';

describe('AccountService', () => {
  let service: AccountService;
  let usersServiceMock: UsersService;
  let jwtServiceSpy: JwtPassportService;

  beforeEach(async () => {
    usersServiceMock = mock<UsersService>(UsersService);

    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtStrategyModule],
      providers: [
        AccountService,
        {
          provide: UsersService,
          useValue: instance(usersServiceMock),
        },
      ],
    }).compile();

    service = module.get<AccountService>(AccountService);
    jwtServiceSpy = spy(module.get<JwtPassportService>(JwtPassportService));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register user in UsersService', () => {
      const expectedDto: CreateUserRequestDto = { email: 'test', password: 'password', firstName: 'User', lastName: 'Test' };

      service.register(expectedDto, undefined);

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
        await expect(service.login(loginUser)).rejects.toThrowError(UnverifiedEmailException);
      });
    });

    describe('with locked user', () => {
      beforeEach(() => {
        loginUser = { ...loginUser, locked: true };
      });

      it('should throw LockedAccountException', async () => {
        await expect(service.login(loginUser)).rejects.toThrowError(LockedAccountException);
      });
    });

    describe('with valid user', () => {
      it('should return generated token for logged user', async () => {
        const bearerToken = 'token';

        when(jwtServiceSpy.generateToken(loginUser)).thenResolve({ access_token: bearerToken });

        const loginResult = await service.login(loginUser);

        expect(loginResult.access_token).toEqual(bearerToken);
      });
    });
  });
});
