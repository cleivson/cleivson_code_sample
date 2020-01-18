import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { deepEqual, spy, verify, when } from 'ts-mockito';
import { LoggedUserDto, User, UserRoles, UsersService } from 'users';
import { BasicPassportStrategy } from './basic-passport-strategy';

describe('BasicPassportStrategy', () => {
  let strategy: BasicPassportStrategy;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BasicPassportStrategy, {
        provide: UsersService,
        useValue: { findOne: () => { /* */ }, verifyPassword: () => { /* */ } },
      }],
    }).compile();

    usersService = spy(module.get<UsersService>(UsersService));
    strategy = module.get<BasicPassportStrategy>(BasicPassportStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('.validate()', () => {
    const userEmail = 'testuser';
    const password = 'password';

    const expectedLoggedUser: LoggedUserDto = { email: userEmail, id: 23, role: UserRoles.User, verified: true, locked: true };

    it('should throw exception for invalid user', async () => {
      when(usersService.findOne(deepEqual({ email: userEmail }))).thenResolve(null);

      await expect(strategy.validate(userEmail, password))
        .rejects
        .toThrowError(UnauthorizedException);

      verify(usersService.findOne(deepEqual({ email: userEmail }))).once();
    });

    it('should throw exception for invalid password', async () => {
      const passwordHash = 'klasdma';
      const user: User = { passwordHash, password, ...expectedLoggedUser };

      when(usersService.findOne(deepEqual({ email: userEmail }))).thenResolve(user);
      when(usersService.verifyPassword(password, user)).thenResolve(false);

      await expect(strategy.validate(userEmail, password))
        .rejects
        .toThrowError(UnauthorizedException);

      verify(usersService.findOne(deepEqual({ email: userEmail }))).once();
      verify(usersService.verifyPassword(password, user)).once();
    });

    it('should return logged user for right credentials', async () => {
      const passwordHash = 'klasdma';

      when(usersService.findOne(deepEqual({ email: userEmail }))).thenResolve(expectedLoggedUser);

      when(usersService.verifyPassword(password, expectedLoggedUser)).thenResolve(true);

      const actualLoggedUser = await strategy.validate(userEmail, password);

      expect(actualLoggedUser).toEqual(expectedLoggedUser);
    });
  });
});
