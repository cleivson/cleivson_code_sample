import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'app.module';
import { MailService } from 'mail';
import { SeederModule, SeederService } from 'seeder';
import { instance, mock } from 'ts-mockito';
import { getConnection, Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { User, UserRoles } from 'users';
import { WeatherProviderService } from 'weather';
import { USERS_ROUTE } from '../constants';
import { getAccessToken } from '../utils/helper.functions';

import req = require('supertest');

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let seederService: SeederService;
  let userRepository: Repository<User>;
  let request: req.SuperTest<req.Test>;
  let accessToken: string;
  let validUserToInsert: Partial<User>;
  let mailService: MailService;
  let weatherService: WeatherProviderService;

  beforeAll(async () => {
    mailService = mock(MailService);
    weatherService = mock(WeatherProviderService);

    moduleFixture = await Test.createTestingModule({
      imports: [AppModule, SeederModule],
    })
      .overrideProvider(MailService)
      .useValue(instance(mailService))
      .overrideProvider(WeatherProviderService)
      .useValue(instance(weatherService))
      .compile();

    app = moduleFixture.createNestApplication();
    seederService = app.get(SeederService);
    userRepository = getConnection().getRepository(User);

    await app.init();

    request = req(app.getHttpServer());
  });

  beforeEach(async () => {
    jest.setTimeout(10000);

    await seederService.seed();

    accessToken = await getAccessToken(request, seederService.getAdminUserCredentials());

    validUserToInsert = {
      email: 'test@test.com',
      password: 'password',
      role: UserRoles.Admin,
      passwordHash: undefined,
      firstName: 'Test',
      lastName: 'User',
    };
  });

  describe('Root routes', () => {
    describe(`${USERS_ROUTE} (GET)`, () => {
      describe('with no query filter', () => {
        it('should return all users', async () => {
          return request.get(USERS_ROUTE)
            .auth(accessToken, { type: 'bearer' })
            .expect(HttpStatus.OK)
            .expect(response => {
              const returnedUsers: User[] = response.body;

              expect(returnedUsers).toBeDefined();

              // Seeder creates 3 users
              expect(returnedUsers).toHaveLength(3);

              returnedUsers.forEach(expectResponseNotToContainPasswordInfo);
            });
        });
      });

      describe('with query filter', () => {
        beforeEach(async () => {
          const usersToInsert: Array<QueryDeepPartialEntity<User>> = [
            { email: 'user1', role: UserRoles.User, passwordHash: 'fakehash', firstName: 'User1', lastName: 'Test' },
            { email: 'user2', role: UserRoles.User, passwordHash: 'fakehash', firstName: 'User2', lastName: 'Test' },
            { email: 'admin1', role: UserRoles.Admin, passwordHash: 'fakehash', firstName: 'Admin1', lastName: 'Test' },
            { email: 'admin2', role: UserRoles.Admin, passwordHash: 'fakehash', firstName: 'Admin2', lastName: 'Test' },
          ];
          await userRepository.insert(usersToInsert);
        });

        it('should return only filtered results', async () => {
          const query = 'firstName != \'User2\' and (role = \'User\' or firstName = \'Admin1\')';

          return request.get(USERS_ROUTE)
            .auth(accessToken, { type: 'bearer' })
            .query({ query })
            .expect(HttpStatus.OK)
            .expect(response => {
              const returnedUsers: User[] = response.body;

              expect(returnedUsers).toBeDefined();
              expect(returnedUsers.find(user => user.email === 'admin2')).toBeUndefined();
              expect(returnedUsers.find(user => user.email === 'user2')).toBeUndefined();
              expect(returnedUsers.find(user => user.email === 'admin1')).toBeDefined();
              expect(returnedUsers.find(user => user.email === 'user1')).toBeDefined();

              returnedUsers.forEach(expectResponseNotToContainPasswordInfo);
            });
        });
      });
    });

    describe(`${USERS_ROUTE} (POST)`, () => {

      describe('user with id', () => {
        describe('of a existing user', () => {
          it('should return 409 (Conflict)', async () => {
            const existingUserCredentials = seederService.getRegularUserCredentials();

            const existingUser = await userRepository.findOne({ email: existingUserCredentials.email });

            return request.post(USERS_ROUTE)
              .auth(accessToken, { type: 'bearer' })
              .send({ ...validUserToInsert, id: existingUser.id })
              .expect(HttpStatus.CONFLICT);
          });
        });
        describe('of a new user', () => {
          it('should return 201 (Created)', () => {
            return request.post(USERS_ROUTE)
              .auth(accessToken, { type: 'bearer' })
              .send({ ...validUserToInsert, id: 100 })
              .expect(HttpStatus.CREATED);
          });
        });
      });

      describe('user with password hash', () => {
        it('should return 400 (Bad Request)', () => {
          return request.post(USERS_ROUTE)
            .auth(accessToken, { type: 'bearer' })
            .send({ ...validUserToInsert, passwordHash: 'passwordhash' })
            .expect(HttpStatus.BAD_REQUEST);
        });
      });

      describe('user without password', () => {
        it('should return 400 (Bad Request)', () => {
          validUserToInsert.password = undefined;

          return request.post(USERS_ROUTE)
            .auth(accessToken, { type: 'bearer' })
            .send(validUserToInsert)
            .expect(HttpStatus.BAD_REQUEST);
        });
      });

      describe('user without username', () => {
        it('should return 400 (Bad Request)', () => {
          validUserToInsert.email = undefined;

          return request.post(USERS_ROUTE)
            .auth(accessToken, { type: 'bearer' })
            .send(validUserToInsert)
            .expect(HttpStatus.BAD_REQUEST);
        });
      });

      describe('user without role', () => {
        it('should save as regular user', async () => {
          validUserToInsert.role = undefined;

          await request.post(USERS_ROUTE)
            .auth(accessToken, { type: 'bearer' })
            .send(validUserToInsert)
            .expect(HttpStatus.CREATED);

          const insertedUser = await userRepository.findOne({ email: validUserToInsert.email });

          expect(insertedUser.role).toEqual(UserRoles.User);
        });
      });

      describe('valid user', () => {
        it('should not save plain text password', async () => {
          await request.post(USERS_ROUTE)
            .auth(accessToken, { type: 'bearer' })
            .send(validUserToInsert)
            .expect(HttpStatus.CREATED);

          const insertedUser = await userRepository.findOne({ email: validUserToInsert.email });

          expect(insertedUser.password).toBeUndefined();
          expect(insertedUser.passwordHash).toBeDefined();
          expect(insertedUser.passwordHash).not.toEqual(validUserToInsert.password);
        });
      });

      describe('existing username', () => {
        it('should return 409 (Conflict)', async () => {
          const existingUser = seederService.getRegularUserCredentials();
          return request.post(USERS_ROUTE)
            .auth(accessToken, { type: 'bearer' })
            .send({ ...validUserToInsert, ...existingUser })
            .expect(HttpStatus.CONFLICT);
        });
      });
    });
  });

  describe('User specific routes', () => {
    describe(`${USERS_ROUTE}/:id (GET)`, () => {
      describe('non existing user', () => {
        it('should throw 404 (Not Found)', () => {
          return request.get(`${USERS_ROUTE}/100`)
            .auth(accessToken, { type: 'bearer' })
            .expect(HttpStatus.NOT_FOUND);
        });
      });

      describe('valid user id', () => {
        beforeEach(async () => {
          await insertUserInRepository();
        });

        it('should return all fields but password fields', () => {
          return request.get(`${USERS_ROUTE}/${validUserToInsert.id}`)
            .auth(accessToken, { type: 'bearer' })
            .expect(HttpStatus.OK)
            .expect(response => {
              expectUsersToBeEqual(response.body, validUserToInsert);
              expectResponseNotToContainPasswordInfo(response.body);
            });
        });
      });
    });

    describe(`${USERS_ROUTE}/:id (PUT)`, () => {

      // TODO test if PUT can erase fields with null

      describe('update only password', () => {
        beforeEach(async () => {
          await insertUserInRepository();
        });

        it('should keep other values unchanged', async () => {
          const password = 'a new password';
          await request.put(`${USERS_ROUTE}/${validUserToInsert.id}`)
            .auth(accessToken, { type: 'bearer' })
            .send({ password })
            .expect(HttpStatus.OK)
            .expect(response => {
              expectResponseNotToContainPasswordInfo(response.body);
            });

          const persistedUser = await userRepository.findOne(validUserToInsert.id);

          const expectedReponse = { ...validUserToInsert, password };
          expectUsersToBeEqual(persistedUser, expectedReponse);
        });
      });

      describe('update only role', () => {
        beforeEach(async () => {
          await insertUserInRepository();
        });

        it('should keep other values unchanged', async () => {
          const role = UserRoles.UserManager;
          await request.put(`${USERS_ROUTE}/${validUserToInsert.id}`)
            .auth(accessToken, { type: 'bearer' })
            .send({ role })
            .expect(HttpStatus.OK)
            .expect(response => {
              expectResponseNotToContainPasswordInfo(response.body);
            });

          const persistedUser = await userRepository.findOne(validUserToInsert.id);

          const expectedReponse = { ...validUserToInsert, role };
          expectUsersToBeEqual(persistedUser, expectedReponse);
        });
      });
    });

    describe(`${USERS_ROUTE}/:id (PATCH)`, () => {
      describe('update only password', () => {
        beforeEach(async () => {
          await insertUserInRepository();
        });

        it('should keep other values unchanged', async () => {
          const password = 'a new password';
          await request.patch(`${USERS_ROUTE}/${validUserToInsert.id}`)
            .auth(accessToken, { type: 'bearer' })
            .send({ password })
            .expect(HttpStatus.OK)
            .expect(response => {
              expectResponseNotToContainPasswordInfo(response.body);
            });

          const persistedUser = await userRepository.findOne(validUserToInsert.id);

          const expectedReponse = { ...validUserToInsert, password };
          expectUsersToBeEqual(persistedUser, expectedReponse);
        });
      });

      describe('update only role', () => {
        beforeEach(async () => {
          await insertUserInRepository();
        });

        it('should keep other values unchanged', async () => {
          const role = UserRoles.UserManager;
          await request.patch(`${USERS_ROUTE}/${validUserToInsert.id}`)
            .auth(accessToken, { type: 'bearer' })
            .send({ role })
            .expect(HttpStatus.OK)
            .expect(response => {
              expectResponseNotToContainPasswordInfo(response.body);
            });

          const persistedUser = await userRepository.findOne(validUserToInsert.id);

          const expectedReponse = { ...validUserToInsert, role };
          expectUsersToBeEqual(persistedUser, expectedReponse);
        });
      });
    });

    describe(`${USERS_ROUTE}/:id (DELETE)`, () => {
      describe('non existing user', () => {
        it('should throw 404 (Not Found)', () => {
          return request.get(`${USERS_ROUTE}/100`)
            .auth(accessToken, { type: 'bearer' })
            .expect(HttpStatus.NOT_FOUND);
        });
      });

      describe('existing user', () => {
        // TODO check if the jogging entries were removed

        beforeEach(async () => {
          await insertUserInRepository();
        });

        it('should remove the user', async () => {
          await request.delete(`${USERS_ROUTE}/${validUserToInsert.id}`)
            .auth(accessToken, { type: 'bearer' })
            .expect(HttpStatus.OK)
            .expect(response => expectResponseNotToContainPasswordInfo(response.body));

          const user: User = await userRepository.findOne(validUserToInsert.id);

          expect(user).toBeUndefined();
        });
      });
    });
  });

  afterEach(async () => {
    await getConnection().synchronize(true);
  });

  afterAll(async () => {
    await app.close();
    await moduleFixture.close();
  });

  const insertUserInRepository = async () => {
    validUserToInsert.passwordHash = 'fakepassword';
    return userRepository.insert(validUserToInsert);
  };
});

function expectUsersToBeEqual(insertedUser: User, expectedUser: Partial<User>) {
  expect(insertedUser).toBeDefined();
  expect(insertedUser.id).toEqual(expectedUser.id);
  expect(insertedUser.role).toEqual(expectedUser.role);
  expect(insertedUser.email).toEqual(expectedUser.email);
}

function expectResponseNotToContainPasswordInfo(responseUser: any) {
  expect(responseUser.password).toBeUndefined();
  expect(responseUser.passwordHash).toBeUndefined();
  expect(responseUser.passwordField).toBeUndefined();
}
