import { Test, TestingModule } from '@nestjs/testing';
import { JwtPassportService, JwtStrategyModule } from 'auth/jwt';
import { capture, instance, mock, spy } from 'ts-mockito';
import { CreateUserRequestDto, UsersService } from 'users';
import { AccountController } from './account.controller';

describe('Account Controller', () => {
  let controller: AccountController;
  let usersServiceMock: UsersService;
  let jwtServiceSpy: JwtPassportService;

  beforeEach(async () => {
    usersServiceMock = mock<UsersService>(UsersService);

    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtStrategyModule],
      controllers: [AccountController],
      providers: [{
        provide: UsersService,
        useValue: instance(usersServiceMock),
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
      const expectedDto: CreateUserRequestDto = { username: 'test', password: 'password' };

      controller.register(undefined, expectedDto);

      const [, actualDto] = capture(usersServiceMock.createOne).last();

      expect(actualDto).toEqual(expectedDto);
    });
  });

  describe('login', () => {
    it('should generate token for logged user', () => {
      const expectedUser = { username: 'user', password: 'strongpassword' };

      controller.login({ user: expectedUser });

      const [actualUser] = capture(jwtServiceSpy.generateToken).last();
      expect(actualUser).toEqual(expectedUser);
    });
  });
});
