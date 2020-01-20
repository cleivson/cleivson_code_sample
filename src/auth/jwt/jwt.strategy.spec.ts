import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from 'config';
import { mock, spy, when } from 'ts-mockito';
import { User, UsersService } from 'users';
import { LockedAccountException, UnverifiedEmailException } from '../exceptions';
import { TokenPayload } from './dto';
import { JwtPassportService } from './jwt.service';
import { JwtPassportStrategy } from './jwt.strategy';

describe('JwtPassportStrategy', () => {
  let strategy: JwtPassportStrategy;
  let service: JwtPassportService;
  let configService: ConfigService;
  let usersService: UsersService;

  beforeEach(async () => {
    usersService = mock<UsersService>(UsersService);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtPassportStrategy,
        {
          provide: JwtPassportService,
          useValue: {
            parseToken: () => { // nothing } },
            },
          },
        },
        {
          provide: ConfigService,
          useValue: { get: () => 'secret' },
        },
        {
          provide: UsersService,
          useValue: { findOne: () => { /* */ } },
        },
      ],
    }).compile();

    service = module.get<JwtPassportService>(JwtPassportService);
    strategy = module.get<JwtPassportStrategy>(JwtPassportStrategy);
    configService = module.get<ConfigService>(ConfigService);
    usersService = spy(module.get<UsersService>(UsersService));
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('.validate()', () => {
    const userId = 23;

    const tokenPayload: TokenPayload = { username: 'test@test.com', sub: userId };

    describe('token with id of non existent user', () => {
      beforeEach(() => {
        when(usersService.findOne(userId)).thenResolve(undefined);
      });

      it('should throw UnauthorizedException', () => {
        expect(strategy.validate(tokenPayload)).rejects.toThrow(UnauthorizedException);
      });
    });

    describe('token with id of persisted user', () => {
      let persistedUser: User;

      beforeEach(() => {
        persistedUser = { id: userId, firstName: 'User', lastName: 'Test', email: 'invalid@test.com' };
        when(usersService.findOne(userId)).thenResolve(persistedUser);
      });

      describe('with different email', () => {

        beforeEach(() => {
          persistedUser.email = tokenPayload.username.substr(0, 3);
        });

        it('should throw UnauthorizedException', () => {
          expect(strategy.validate(tokenPayload)).rejects.toThrow(UnauthorizedException);
        });
      });

      describe('with same email', () => {
        beforeEach(() => {
          persistedUser.email = tokenPayload.username;
        });

        describe('but non verified', () => {
          beforeEach(() => {
            persistedUser.verified = false;
          });

          it('should throw UnverifiedEmailException', () => {
            expect(strategy.validate(tokenPayload)).rejects.toThrowError(UnverifiedEmailException);
          });
        });

        describe('but locked', () => {
          beforeEach(() => {
            persistedUser.locked = true;
          });

          it('should throw LockedAccountException', () => {
            expect(strategy.validate(tokenPayload)).rejects.toThrowError(LockedAccountException);
          });
        });

        describe('verified and unlocked', () => {
          beforeEach(() => {
            persistedUser.verified = true;
            persistedUser.locked = false;
          });

          it('should return user', async () => {
            const loggedUser = await strategy.validate(tokenPayload);

            expect(loggedUser).toEqual(persistedUser);
          });
        });
      });
    });
  });
});
