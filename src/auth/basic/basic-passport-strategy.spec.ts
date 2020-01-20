import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from 'config';
import { anything, capture, deepEqual, spy, when } from 'ts-mockito';
import { User, UserRoles, UsersService } from 'users';
import { LockedAccountException, UnverifiedEmailException } from '../exceptions';
import { BasicPassportStrategy } from './basic-passport-strategy';

describe('BasicPassportStrategy', () => {
  let strategy: BasicPassportStrategy;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BasicPassportStrategy,
        {
          provide: UsersService,
          useValue: { findOne: () => { /* */ }, verifyPassword: () => { /* */ }, save: () => { /* */ } },
        },
        {
          provide: ConfigService,
          useValue: { get: () => 'secret' },
        },
      ],
    }).compile();

    usersService = spy(module.get<UsersService>(UsersService));
    strategy = module.get<BasicPassportStrategy>(BasicPassportStrategy);

    when(usersService.save(anything())).thenCall(user => user);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('.validate()', () => {
    const userEmail = 'testuser';
    const password = 'password';

    describe('non existent user', () => {
      beforeEach(() => {
        when(usersService.findOne(deepEqual({ email: userEmail }))).thenResolve();
      });

      it('should throw UnauthorizedException', async () => {
        await expect(strategy.validate(userEmail, password))
          .rejects
          .toThrowError(UnauthorizedException);
      });
    });

    describe('existent user', () => {
      const passwordHash = 'klasdma';
      let user: User;

      beforeEach(() => {
        user = { passwordHash, email: userEmail, id: 23, role: UserRoles.User, verified: true, locked: false };

        when(usersService.findOne(deepEqual({ email: userEmail }))).thenResolve(user);
      });

      describe('with wrong password', () => {
        const maximumAttempts = 3;

        beforeEach(() => {
          when(usersService.verifyPassword(password, user)).thenResolve(false);
        });

        describe('less than maximum attempts', () => {
          beforeEach(() => {
            user.incorrectLogins = maximumAttempts - 1;
          });

          it('should throw UnauthorizedException and increment incorrect logins', async () => {
            await expect(strategy.validate(userEmail, password))
              .rejects
              .toThrowError(UnauthorizedException);

            const [savedUser] = capture(usersService.save).last();

            expect(savedUser.incorrectLogins).toBe(maximumAttempts);
            expect(savedUser.locked).toBeFalsy();
          });
        });

        describe('maximum number of attempts', () => {
          beforeEach(() => {
            user.incorrectLogins = maximumAttempts;
          });

          it('should throw LockedAccountException and increment incorrect logins', async () => {
            await expect(strategy.validate(userEmail, password))
              .rejects
              .toThrowError(LockedAccountException);

            const [savedUser] = capture(usersService.save).last();

            expect(savedUser.incorrectLogins).toBe(maximumAttempts + 1);
            expect(savedUser.locked).toBeTruthy();
          });
        });

        describe('user unverified', () => {
          beforeEach(() => {
            user.verified = false;
          });

          describe('user locked', () => {
            beforeEach(() => {
              user.locked = true;
            });

            it('should throw LockedAccountException', async () => {
              await expect(strategy.validate(userEmail, password))
                .rejects
                .toThrowError(LockedAccountException);
            });
          });

          describe('user unlocked', () => {
            beforeEach(() => {
              user.locked = false;
            });

            it('should throw UnauthorizedException', async () => {
              await expect(strategy.validate(userEmail, password))
                .rejects
                .toThrowError(UnauthorizedException);
            });
          });
        });

        describe('user verified', () => {
          beforeEach(() => {
            user.verified = false;
          });

          describe('user locked', () => {
            beforeEach(() => {
              user.locked = true;
            });

            it('should throw LockedAccountException', async () => {
              await expect(strategy.validate(userEmail, password))
                .rejects
                .toThrowError(LockedAccountException);
            });
          });

          describe('user unlocked', () => {
            beforeEach(() => {
              user.locked = false;
            });

            it('should throw UnauthorizedException', async () => {
              await expect(strategy.validate(userEmail, password))
                .rejects
                .toThrowError(UnauthorizedException);
            });
          });
        });
      });

      describe('with right password', () => {
        beforeEach(() => {
          when(usersService.verifyPassword(password, user)).thenResolve(true);
        });

        describe('user unverified', () => {
          beforeEach(() => {
            user.verified = false;
          });

          describe('user locked', () => {
            beforeEach(() => {
              user.locked = true;
            });

            it('should throw LockedAccountException', async () => {
              await expect(strategy.validate(userEmail, password))
                .rejects
                .toThrowError(LockedAccountException);
            });
          });

          describe('user unlocked', () => {
            beforeEach(() => {
              user.locked = false;
            });

            it('should throw UnverifiedEmailException', async () => {
              await expect(strategy.validate(userEmail, password))
                .rejects
                .toThrowError(UnverifiedEmailException);
            });
          });
        });

        describe('user verified', () => {
          beforeEach(() => {
            user.verified = true;
          });

          describe('user locked', () => {
            beforeEach(() => {
              user.locked = true;
            });

            it('should throw LockedAccountException', async () => {
              await expect(strategy.validate(userEmail, password))
                .rejects
                .toThrowError(LockedAccountException);
            });
          });

          describe('user unlocked', () => {
            beforeEach(() => {
              user.locked = false;
            });

            it('should return logged user', async () => {
              const actualLoggedUser = await strategy.validate(userEmail, password);

              expect(actualLoggedUser).toEqual(user);
            });

            it('should clean incorrect logins', async () => {
              await strategy.validate(userEmail, password);

              const [savedUser] = capture(usersService.save).last();

              expect(savedUser.incorrectLogins).toBe(0);
              expect(savedUser.locked).toBeFalsy();
            });
          });
        });
      });
    });
  });
});
