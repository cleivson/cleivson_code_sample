import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from 'app.module';
import { MailService } from 'mail';
import { SeederModule, SeederService } from 'seeder';
import * as req from 'supertest';
import { instance, mock } from 'ts-mockito';
import { Repository } from 'typeorm';
import { CreateUserRequestDto, User, UserRoles } from 'users';
import { WeatherProviderService } from '../../src/weather';

const LOGIN_ROUTE = '/account/login';
const REGISTER_ROUTE = '/account/register';

describe('AccountController (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let seederService: SeederService;
  let userRepository: Repository<User>;
  let request: req.SuperTest<req.Test>;
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
    userRepository = app.get(getRepositoryToken(User));

    await app.init();

    request = req(app.getHttpServer());
  });

  beforeEach(async () => {
    jest.setTimeout(10000);
  });

  beforeEach(async () => {
    await userRepository.manager.connection.synchronize(true);
    await seederService.seed();
  });

  describe(`${LOGIN_ROUTE} (POST)`, () => {
    it('should return 401 for no credentials', async () => {
      return request
        .post(LOGIN_ROUTE)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 401 for wrong password', async () => {
      const credentials = seederService.getRegularUserCredentials();

      return request
        .post(LOGIN_ROUTE)
        .auth(credentials.email, 'wrongpassword', { type: 'basic' })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    describe('with valid credentials', () => {
      it('should return bearer token for regular user credentials', async () => {
        const credentials = seederService.getRegularUserCredentials();

        return request
          .post(LOGIN_ROUTE)
          .auth(credentials.email, credentials.password, { type: 'basic' })
          .expect(HttpStatus.OK)
          .expect(response => {
            const accessToken = response.body.accessToken;

            expect(accessToken).toBeDefined();
            expect(accessToken.split('.')).toHaveLength(3); // Bearer token has 3 parts separated by .
          });
      });

      it('should return bearer token for user manager credentials', async () => {
        const credentials = seederService.getManagerUserCredentials();

        return request
          .post(LOGIN_ROUTE)
          .auth(credentials.email, credentials.password, { type: 'basic' })
          .expect(HttpStatus.OK)
          .expect(response => {
            const accessToken = response.body.accessToken;

            expect(accessToken).toBeDefined();
            expect(accessToken.split('.')).toHaveLength(3); // Bearer token has 3 parts separated by .
          });
      });

      it('should return bearer token for admin credentials', async () => {
        const credentials = seederService.getAdminUserCredentials();

        return request
          .post(LOGIN_ROUTE)
          .auth(credentials.email, credentials.password, { type: 'basic' })
          .expect(HttpStatus.OK)
          .expect(response => {
            const accessToken = response.body.accessToken;

            expect(accessToken).toBeDefined();
            expect(accessToken.split('.')).toHaveLength(3); // Bearer token has 3 parts separated by '.'
            expectResponseNotToContainPasswordInfo(response);
          });
      });
    });
  });

  describe(`${REGISTER_ROUTE} (POST)`, () => {
    let validCredentials: CreateUserRequestDto;

    beforeEach(() => {
      validCredentials = { email: 'testuser@test.com', password: 'foobar', firstName: 'User', lastName: 'Test' };
    });

    describe('with role set', () => {
      it('should return 400 (BAD REQUEST)', () => {

        return request
          .post(REGISTER_ROUTE)
          .send({ ...validCredentials, role: UserRoles.Admin })
          .expect(HttpStatus.BAD_REQUEST);
      });
    });

    describe('duplicated username', () => {
      it('should return 409 (CONFLICT)', () => {
        return request
          .post(REGISTER_ROUTE)
          .send({ ...validCredentials, ...seederService.getRegularUserCredentials() })
          .expect(HttpStatus.CONFLICT);
      });
    });

    describe('empty credentials', () => {
      it('should return 400 (BAD REQUEST)', () => {
        return request
          .post(REGISTER_ROUTE)
          .expect(HttpStatus.BAD_REQUEST);
      });
    });

    describe('valid username and password', () => {
      beforeEach(async () => {
        await request
          .post(REGISTER_ROUTE)
          .send(validCredentials)
          .expect(HttpStatus.CREATED)
          .expect(response => {
            expectResponseNotToContainPasswordInfo(response);
          });
      });

      it('should create the user as regular user', async () => {
        const createdUser = await userRepository.findOne({ where: { email: validCredentials.email } });

        expect(createdUser.role).toEqual(UserRoles.User);
      });

      it('should create the user as unverified', async () => {
        const createdUser = await userRepository.findOne({ where: { email: validCredentials.email } });

        expect(createdUser.verified).toBeFalsy();
      });

      it('should not be able to login until verified', async () => {
        await request.post(LOGIN_ROUTE)
          .auth(validCredentials.email, validCredentials.password, { type: 'basic' })
          .expect(response => {
            expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
            expect(response.body.message).toBe('E-mail not verified');
          });
      });

      describe('with verified email', () => {
        beforeEach(async () => {
          const createdUser = await userRepository.findOne({ where: { email: validCredentials.email } });
          createdUser.verified = true;
          await userRepository.save(createdUser);
        });
        it('should be able to login', async () => {
          await request.post(LOGIN_ROUTE)
            .auth(validCredentials.email, validCredentials.password, { type: 'basic' })
            .expect(HttpStatus.OK);
        });
      });
    });
  });

  afterAll(async () => {
    await app.close();
    await moduleFixture.close();
  });
});

function expectResponseNotToContainPasswordInfo(response: req.Response) {
  expect(response.body.password).toBeUndefined();
  expect(response.body.passwordHash).toBeUndefined();
  expect(response.body.passwordField).toBeUndefined();
}
