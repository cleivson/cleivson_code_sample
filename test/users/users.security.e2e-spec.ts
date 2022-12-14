import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'app.module';
import { MailService } from 'mail';
import { SeederModule, SeederService } from 'seeder';
import { instance, mock } from 'ts-mockito';
import { Repository } from 'typeorm';
import { CreateUserRequestDto, User, UserRoles } from 'users';
import { WeatherProviderService } from 'weather';
import { USERS_ROUTE } from '../constants';
import { getAccessToken } from '../utils/helper.functions';

import req = require('supertest');
import { getRepositoryToken } from '@nestjs/typeorm';

let app: INestApplication;
let moduleFixture: TestingModule;
let seederService: SeederService;
let userRepository: Repository<User>;
let request: req.SuperTest<req.Test>;
let mailService: MailService;
let weatherService: WeatherProviderService;

describe('UserController Security (e2e)', () => {
  jest.setTimeout(10000);

  const validUserToInsert: User = { firstName: 'User', lastName: 'test', email: 'test@test.com', password: 'test', role: UserRoles.User };

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
    userRepository = app.get(getRepositoryToken(User));

    await app.init();

    request = req(app.getHttpServer());
  });

  beforeEach(() => {
  });

  beforeEach(async () => {
    await userRepository.manager.connection.synchronize(true);
    await seederService.seed();
  });

  describe('Unauthenticated', () => {
    testRootEndpoints(validUserToInsert, false);
    testDifferentUserEndpoints({ ...validUserToInsert, role: UserRoles.User }, false);
    testDifferentUserEndpoints({ ...validUserToInsert, role: UserRoles.UserManager }, false);
    testDifferentUserEndpoints({ ...validUserToInsert, role: UserRoles.Admin }, false);
  });

  describe('Logged as regular user', () => {
    const getCredentials = seeder => seeder.getRegularUserCredentials();

    testRootEndpoints(validUserToInsert, false, getCredentials);
    testSameUserEndpoints(true, getCredentials);
    testDifferentUserEndpoints({ ...validUserToInsert, role: UserRoles.User }, false, getCredentials);
    testDifferentUserEndpoints({ ...validUserToInsert, role: UserRoles.UserManager }, false, getCredentials);
    testDifferentUserEndpoints({ ...validUserToInsert, role: UserRoles.Admin }, false, getCredentials);
  });

  describe('Logged as user manager', () => {
    const getCredentials = seeder => seeder.getManagerUserCredentials();

    testRootEndpoints(validUserToInsert, true, getCredentials);
    testSameUserEndpoints(true, getCredentials);
    testDifferentUserEndpoints({ ...validUserToInsert, role: UserRoles.User }, true, getCredentials);
    testDifferentUserEndpoints({ ...validUserToInsert, role: UserRoles.UserManager }, true, getCredentials);
    testDifferentUserEndpoints({ ...validUserToInsert, role: UserRoles.Admin }, false, getCredentials);
  });

  describe('Logged as admin', () => {
    const getCredentials = seeder => seeder.getAdminUserCredentials();

    testRootEndpoints(validUserToInsert, true, getCredentials);
    testSameUserEndpoints(true, getCredentials);
    testDifferentUserEndpoints({ ...validUserToInsert, role: UserRoles.User }, true, getCredentials);
    testDifferentUserEndpoints({ ...validUserToInsert, role: UserRoles.UserManager }, true, getCredentials);
    testDifferentUserEndpoints({ ...validUserToInsert, role: UserRoles.Admin }, true, getCredentials);
  });

  describe('change role', () => {
    it('should give access to new role features', async () => {
      const userCredential: User = validUserToInsert;

      const adminAccessToken = await getAccessToken(request, seederService.getAdminUserCredentials());

      let userId: number;

      // Create a new regular user
      await request.post(USERS_ROUTE)
        .auth(adminAccessToken, { type: 'bearer' })
        .send(userCredential)
        .expect(HttpStatus.CREATED)
        .expect(response => userId = response.body.id);

      await verifyUser(userCredential);

      let userAccessToken = await getAccessToken(request, userCredential);

      // The regular user should not have access to get list all users
      await request.get(USERS_ROUTE)
        .auth(userAccessToken, { type: 'bearer' })
        .expect(HttpStatus.FORBIDDEN);

      // Change user's role to UserManager
      await request.patch(`${USERS_ROUTE}/${userId}`)
        .auth(adminAccessToken, { type: 'bearer' })
        .send({ role: UserRoles.UserManager })
        .expect(HttpStatus.OK);

      // A new token is needed since the old one still contains the old role
      userAccessToken = await getAccessToken(request, userCredential);

      // Now the user should have access to get list all users
      await request.get(USERS_ROUTE)
        .auth(userAccessToken, { type: 'bearer' })
        .expect(HttpStatus.OK);
    });
  });

  afterAll(async () => {
    await app.close();
    await moduleFixture.close();
  });
});

function testRootEndpoints(validUserToInsert: Partial<User>,
                           expectAuthorized: boolean,
                           getCredentials?: (seederService: SeederService) => CreateUserRequestDto) {
  let accessToken: string;
  let failureStatus: HttpStatus;
  let credentials: CreateUserRequestDto;

  beforeEach(async () => {
    if (getCredentials) {
      credentials = getCredentials(seederService);
      accessToken = await getAccessToken(request, credentials);
    }
    failureStatus = accessToken ? HttpStatus.FORBIDDEN : HttpStatus.UNAUTHORIZED;
  });

  describe('root routes', () => {
    describe(`${USERS_ROUTE} (GET)`, () => {
      it(`should return Authorized=${expectAuthorized}`, async () => {
        testGet(expectAuthorized, USERS_ROUTE, accessToken);
      });
    });

    describe(`${USERS_ROUTE} (POST)`, () => {
      it(`should return Authorized=${expectAuthorized}`, async () => {
        const expectedStatus = expectAuthorized ? HttpStatus.CREATED : failureStatus;
        await request.post(USERS_ROUTE)
          .auth(accessToken, { type: 'bearer' })
          .send(validUserToInsert)
          .expect(expectedStatus);
      });
    });
  });
}

function testSameUserEndpoints(expectAuthorized: boolean, getCredentials?: (seederService: SeederService) => CreateUserRequestDto) {
  let accessToken: string;
  let credentials: CreateUserRequestDto;
  let loggedUser: User;
  let loggedUserRoute: string;

  describe('editing logged user', () => {
    beforeEach(async () => {
      credentials = getCredentials(seederService);
      accessToken = await getAccessToken(request, credentials);
      loggedUser = await userRepository.findOne({ where: { email: credentials.email } });
      removeNonWhitelistedProperties(loggedUser);

      loggedUserRoute = `${USERS_ROUTE}/${loggedUser.id}`;
    });

    describe(`${USERS_ROUTE}/:id (GET)`, () => {
      it(`should return Authorized=${expectAuthorized}`, async () => {
        await testGet(expectAuthorized, loggedUserRoute, accessToken);
      });
    });

    describe(`${USERS_ROUTE}/:id (PATCH)`, () => {
      it(`should return Authorized=${expectAuthorized}`, async () => {
        await testPatchUser(expectAuthorized, loggedUserRoute, accessToken, loggedUser);
      });
    });

    describe(`${USERS_ROUTE}/:id (PUT)`, () => {
      it(`should return Authorized=${expectAuthorized}`, async () => {
        await testPutUser(expectAuthorized, loggedUserRoute, accessToken, loggedUser);
      });
    });

    describe(`${USERS_ROUTE}/:id (DELETE)`, () => {
      it(`should return Authorized=${expectAuthorized}`, async () => {
        await testDeleteUser(expectAuthorized, loggedUserRoute, accessToken);
      });
    });
  });
}

function testDifferentUserEndpoints(validUserToInsert: Partial<User>,
                                    expectAuthorized: boolean,
                                    getCredentials?: (seederService: SeederService) => CreateUserRequestDto) {
  let accessToken: string;
  let credentials: CreateUserRequestDto;
  let validUserToUpdate: Partial<User>;
  let specificUserRoute: string;

  describe(`editing different user of role ${validUserToInsert.role}`, () => {
    beforeEach(async () => {
      if (getCredentials) {
        credentials = getCredentials(seederService);
        accessToken = await getAccessToken(request, credentials);
      }

      validUserToUpdate = { ...validUserToInsert, passwordHash: 'fakehashedpassword' };
      await userRepository.insert(validUserToUpdate);
      removeNonWhitelistedProperties(validUserToUpdate);

      specificUserRoute = `${USERS_ROUTE}/${validUserToUpdate.id}`;
    });

    describe(`${USERS_ROUTE}/:id (GET)`, () => {
      it(`should return Authorized=${expectAuthorized}`, async () => {
        await testGet(expectAuthorized, specificUserRoute, accessToken);
      });
    });

    describe(`${USERS_ROUTE}/:id (PATCH)`, () => {
      it(`should return Authorized=${expectAuthorized}`, async () => {
        await testPatchUser(expectAuthorized, specificUserRoute, accessToken, validUserToUpdate);
      });
    });

    describe(`${USERS_ROUTE}/:id (PUT)`, () => {
      it(`should return Authorized=${expectAuthorized}`, async () => {
        await testPutUser(expectAuthorized, specificUserRoute, accessToken, validUserToUpdate);
      });
    });

    describe(`${USERS_ROUTE}/:id (DELETE)`, () => {
      it(`should return Authorized=${expectAuthorized}`, async () => {
        await testDeleteUser(expectAuthorized, specificUserRoute, accessToken);
      });
    });
  });
}

function removeNonWhitelistedProperties(validUserToUpdate: Partial<User>) {
  validUserToUpdate.passwordHash = undefined;
  validUserToUpdate.verified = undefined;
  validUserToUpdate.locked = undefined;
  validUserToUpdate.incorrectLogins = undefined;
}

async function testGet(expectAuthorized: boolean, specificUserRoute: string, accessToken: string) {
  const failureStatus = accessToken ? HttpStatus.FORBIDDEN : HttpStatus.UNAUTHORIZED;
  const expectedStatus = expectAuthorized ? HttpStatus.OK : failureStatus;

  await request.get(specificUserRoute)
    .auth(accessToken, { type: 'bearer' })
    .expect(expectedStatus);
}

async function testDeleteUser(expectAuthorized: boolean, specificUserRoute: string, accessToken: string) {
  const failureStatus = accessToken ? HttpStatus.FORBIDDEN : HttpStatus.UNAUTHORIZED;
  const expectedStatus = expectAuthorized ? HttpStatus.OK : failureStatus;

  await request.delete(specificUserRoute)
    .auth(accessToken, { type: 'bearer' })
    .expect(expectedStatus);
}

async function testPatchUser(expectAuthorized: boolean, specificUserRoute: string, accessToken: string, validUserToUpdate: Partial<User>) {
  const failureStatus = accessToken ? HttpStatus.FORBIDDEN : HttpStatus.UNAUTHORIZED;
  const expectedStatus = expectAuthorized ? HttpStatus.OK : failureStatus;

  await request.patch(specificUserRoute)
    .auth(accessToken, { type: 'bearer' })
    .send(validUserToUpdate)
    .expect(response => {
      expect(response.status).toBe(expectedStatus);
    });
}

async function testPutUser(expectAuthorized: boolean, specificUserRoute: string, accessToken: string, validUserToUpdate: Partial<User>) {
  const failureStatus = accessToken ? HttpStatus.FORBIDDEN : HttpStatus.UNAUTHORIZED;
  const expectedStatus = expectAuthorized ? HttpStatus.OK : failureStatus;

  await request.put(specificUserRoute)
    .auth(accessToken, { type: 'bearer' })
    .send(validUserToUpdate)
    .expect(response => {
      expect(response.status).toBe(expectedStatus);
    });
}

async function verifyUser(userCredential: User) {
  const createdUser = await userRepository.findOne({ where: { email: userCredential.email } });
  createdUser.verified = true;
  await userRepository.save(createdUser);
}
