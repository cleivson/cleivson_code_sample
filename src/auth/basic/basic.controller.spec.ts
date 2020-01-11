import { Test, TestingModule } from '@nestjs/testing';
import { JwtPassportService, JwtStrategyModule } from 'auth/jwt';
import { capture, instance, mock, spy } from 'ts-mockito';
import { CreateUserRequestDto, UsersService } from 'users';
import { BasicAuthenticationController } from './basic.controller';

describe('Basic Authentication Controller', () => {
  let controller: BasicAuthenticationController;
  let usersServiceMock: UsersService;
  let jwtServiceSpy: JwtPassportService;

  beforeEach(async () => {
    usersServiceMock = mock<UsersService>(UsersService);

    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtStrategyModule],
      controllers: [BasicAuthenticationController],
      providers: [{
        provide: UsersService,
        useValue: instance(usersServiceMock),
      }],
    }).compile();

    controller = module.get<BasicAuthenticationController>(BasicAuthenticationController);
    jwtServiceSpy = spy(module.get<JwtPassportService>(JwtPassportService));
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register user in UsersService', () => {
      const expectedRequest: CreateUserRequestDto = { username: 'test', password: 'password' };

      controller.register(expectedRequest);

      const [actualRequest] = capture(usersServiceMock.registerUser).last();
      expect(actualRequest).toEqual(expectedRequest);
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
