import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'app.module';
import { SeederModule, SeederService } from 'seeder';
import * as req from 'supertest';
import { getConnection, Repository } from 'typeorm';
import { User, UserRoles } from 'users';

const LOGIN_ROUTE = '/account/login';
const REGISTER_ROUTE = '/account';

describe('AccountController (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let seederService: SeederService;
  let userRespository: Repository<User>;
  let request: req.SuperTest<req.Test>;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule, SeederModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    seederService = app.get(SeederService);
    userRespository = getConnection().getRepository(User);

    await app.init();

    request = req(app.getHttpServer());
  });

  beforeEach(async () => {
    jest.setTimeout(10000);
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
        .auth(credentials.username, 'wrongpassword', { type: 'basic' })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    describe('with valid credentials', () => {
      it('should return bearer token for regular user credentials', async () => {
        const credentials = seederService.getRegularUserCredentials();

        return request
          .post(LOGIN_ROUTE)
          .auth(credentials.username, credentials.password, { type: 'basic' })
          .expect(HttpStatus.CREATED)
          .expect(response => {
            const access_token = response.body.access_token;

            expect(access_token).toBeDefined();
            expect(access_token.split('.')).toHaveLength(3); // Bearer token has 3 parts separated by .
          });
      });

      it('should return bearer token for user manager credentials', async () => {
        const credentials = seederService.getManagerUserCredentials();

        return request
          .post(LOGIN_ROUTE)
          .auth(credentials.username, credentials.password, { type: 'basic' })
          .expect(HttpStatus.CREATED)
          .expect(response => {
            const access_token = response.body.access_token;

            expect(access_token).toBeDefined();
            expect(access_token.split('.')).toHaveLength(3); // Bearer token has 3 parts separated by .
          });
      });

      it('should return bearer token for admin credentials', async () => {
        const credentials = seederService.getAdminUserCredentials();

        return request
          .post(LOGIN_ROUTE)
          .auth(credentials.username, credentials.password, { type: 'basic' })
          .expect(HttpStatus.CREATED)
          .expect(response => {
            const access_token = response.body.access_token;

            expect(access_token).toBeDefined();
            expect(access_token.split('.')).toHaveLength(3); // Bearer token has 3 parts separated by '.'
            expectResponseNotToContainPasswordInfo(response);
          });
      });
    });
  });

  describe(`${REGISTER_ROUTE} (POST)`, () => {
    describe('with role set', () => {
      it('should return 400 (BAD REQUEST)', () => {
        const username = 'testuser';
        const password = 'foobar';

        return request
          .post(REGISTER_ROUTE)
          .send({ username, password, role: UserRoles.Admin })
          .expect(HttpStatus.BAD_REQUEST);
      });
    });

    describe('duplicated username', () => {
      it('should return 409 (CONFLICT)', () => {
        return request
          .post(REGISTER_ROUTE)
          .send(seederService.getRegularUserCredentials())
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
      const newUsername = 'testuser';
      const newPassword = 'foobar';

      it('should create the user as regular user and be able to login', async () => {
        await request
          .post(REGISTER_ROUTE)
          .send({ username: newUsername, password: newPassword })
          .expect(HttpStatus.CREATED)
          .expect(response => {
            expectResponseNotToContainPasswordInfo(response);
          });

        const createdUser = await userRespository.findOne({ username: newUsername });

        expect(createdUser.role).toEqual(UserRoles.User);

        await request.post(LOGIN_ROUTE)
          .auth(newUsername, newPassword, { type: 'basic'})
          .expect(HttpStatus.CREATED);
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
});

function expectResponseNotToContainPasswordInfo(response: req.Response) {
  expect(response.body.password).toBeUndefined();
  expect(response.body.passwordHash).toBeUndefined();
  expect(response.body.passwordField).toBeUndefined();
}
