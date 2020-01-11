import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LoggedUserDto, UserRoles, UsersService } from 'users';
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

    usersService = module.get<UsersService>(UsersService);
    strategy = module.get<BasicPassportStrategy>(BasicPassportStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('.validate()', () => {
    const username = 'testuser';
    const password = 'password';

    const expectedLoggedUser: LoggedUserDto = { username, id: 23, role: UserRoles.User };

    it('should throw exception for invalid user', async () => {
      const findUserMock = jest.spyOn(usersService, 'findOne');
      findUserMock.mockImplementationOnce((conditions) => Promise.resolve(null));

      await expect(strategy.validate(username, password))
        .rejects
        .toThrowError(UnauthorizedException);

      expect(findUserMock).toHaveBeenCalledWith({ username });

      findUserMock.mockRestore();
    });

    it('should throw exception for invalid password', async () => {
      const passwordHash = 'klasdma';
      const user = { passwordHash, password, ...expectedLoggedUser };

      const findUserMock = jest.spyOn(usersService, 'findOne');
      findUserMock.mockImplementationOnce((conditions) => Promise.resolve(user));

      const verifyPasswordMock = jest.spyOn(usersService, 'verifyPassword');
      verifyPasswordMock.mockImplementation((pass, hash) => Promise.resolve(false));

      await expect(strategy.validate(username, password))
        .rejects
        .toThrowError(UnauthorizedException);

      expect(findUserMock).toHaveBeenCalledWith({ username });
      expect(verifyPasswordMock).toHaveBeenCalledWith(password, user);

      findUserMock.mockRestore();
    });

    it('should return logged user for right credentias', async () => {
      const passwordHash = 'klasdma';

      const findUserMock = jest.spyOn(usersService, 'findOne');
      findUserMock.mockImplementationOnce((conditions) => Promise.resolve({ passwordHash, password, ...expectedLoggedUser }));

      const verifyPasswordMock = jest.spyOn(usersService, 'verifyPassword');
      verifyPasswordMock.mockImplementation((pass, hash) => Promise.resolve(true));

      const actualLoggedUser = await strategy.validate(username, password);

      expect(actualLoggedUser).toEqual(expectedLoggedUser);

      findUserMock.mockRestore();
    });
  });
});
