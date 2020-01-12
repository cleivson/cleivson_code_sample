import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'app.module';
import { JoggingEntry } from 'jogging';
import { SeederModule, SeederService } from 'seeder';
import { getConnection, Repository } from 'typeorm';
import { User, UserRoles } from 'users';
import { JOGGING_ROUTE } from '../constants';
import { getAccessToken } from '../utils/helper.functions';

import req = require('supertest');

describe('JoggingController (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let seederService: SeederService;
  let joggingEntryRepository: Repository<JoggingEntry>;
  let userRepository: Repository<User>;
  let request: req.SuperTest<req.Test>;
  let accessToken: string;
  let validUserToInsert: User;
  let validJoggingEntriesToInsert: JoggingEntry[];

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule, SeederModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    seederService = app.get(SeederService);
    joggingEntryRepository = getConnection().getRepository(JoggingEntry);
    userRepository = getConnection().getRepository(User);

    await app.init();

    request = req(app.getHttpServer());
  });

  beforeEach(async () => {
    jest.setTimeout(10000);

    await seederService.seed();

    accessToken = await getAccessToken(request, seederService.getAdminUserCredentials());

    validUserToInsert = {
      username: 'test',
      password: 'password',
      role: UserRoles.Admin,
      passwordHash: 'fakepassword',
    };

    validJoggingEntriesToInsert = [
      { location: 'Sao Paulo', distanceInMeters: 70, duration: '00:01:00', date: '2019-10-05', time: '13:34:30' },
      { location: 'New York', distanceInMeters: 345, duration: '00:05:00', date: '2019-10-05', time: '13:34:35' },
      { location: 'Las Vegas', distanceInMeters: 235, duration: '00:03:30', date: '2019-10-05', time: '13:34:38' },
      { location: 'Las Vegas', distanceInMeters: 235, duration: '00:03:30', date: '2019-10-06', time: '13:34:38' },
    ];
  });

  describe('Root routes', () => {
    describe(`${JOGGING_ROUTE} (GET)`, () => {
      beforeEach(async () => {
        await insertJoggingEntriesIntoRepository();
      });

      describe('with no query filter', () => {
        it('should return all jogging entries', async () => {
          return request.get(JOGGING_ROUTE)
            .auth(accessToken, { type: 'bearer' })
            .expect(HttpStatus.OK)
            .expect(response => {
              const returnedJoggingEntries: JoggingEntry[] = response.body;

              expect(returnedJoggingEntries).toBeDefined();
              expect(returnedJoggingEntries).toHaveLength(validJoggingEntriesToInsert.length);

              returnedJoggingEntries.forEach(joggingEntry => expect(joggingEntry.user).not.toBeDefined());
            });
        });
      });

      describe('with query filter', () => {
        it('should return only filtered results', async () => {
          const query = 'date < \'2019-10-06\' and (location = \'Las Vegas\' or distanceInMeters < 300)';

          return request.get(JOGGING_ROUTE)
            .auth(accessToken, { type: 'bearer' })
            .query({ query })
            .expect(HttpStatus.OK)
            .expect(response => {
              const returnedJoggingEntries: JoggingEntry[] = response.body;

              expect(returnedJoggingEntries).toBeDefined();
              expect(returnedJoggingEntries).toHaveLength(2);
              expect(returnedJoggingEntries.find(joggingEntry => joggingEntry.location === 'Sao Paulo')).toBeDefined();
              expect(returnedJoggingEntries.find(joggingEntry => joggingEntry.location === 'Las Vegas')).toBeDefined();

              returnedJoggingEntries.forEach(joggingEntry => expect(joggingEntry.user).not.toBeDefined());
            });
        });
      });
    });

    describe(`${JOGGING_ROUTE} (POST)`, () => {
      let validJoggingEntryToInsert: JoggingEntry;

      beforeEach(async () => {
        await insertJoggingEntriesIntoRepository();

        validJoggingEntryToInsert = Object.assign(new JoggingEntry(), validJoggingEntriesToInsert[0], { id: undefined });
      });

      describe('jogging entry with id', () => {
        it('should return Bad Request', () => {
          return request.post(JOGGING_ROUTE)
            .auth(accessToken, { type: 'bearer' })
            .send({ ...validJoggingEntryToInsert, id: 100 })
            .expect(HttpStatus.BAD_REQUEST);
        });
      });

      describe('jogging entry with invalid date', () => {
        it('should return Bad Request', () => {
          return request.post(JOGGING_ROUTE)
            .auth(accessToken, { type: 'bearer' })
            .send({ ...validJoggingEntryToInsert, date: '2019-02-30' })
            .expect(HttpStatus.BAD_REQUEST);
        });
      });

      describe('jogging entry with invalid time', () => {
        it('should return Bad Request', () => {
          return request.post(JOGGING_ROUTE)
            .auth(accessToken, { type: 'bearer' })
            .send({ ...validJoggingEntryToInsert, time: '25:61:22' })
            .expect(HttpStatus.BAD_REQUEST);
        });
      });

      describe('jogging entry with no duration', () => {
        beforeEach(() => {
          validJoggingEntryToInsert.duration = undefined;
        });

        it('should return Bad request', () => {
          return request.post(JOGGING_ROUTE)
            .auth(accessToken, { type: 'bearer' })
            .send(validJoggingEntryToInsert)
            .expect(HttpStatus.BAD_REQUEST);
        });
      });

      // TODO Test valid insertion
      // TODO Test weather api results
      // TODO Test jogging weekly report
    });
  });

  describe('Jogging entry specific routes', () => {
    describe(`${JOGGING_ROUTE}/:id (PUT)`, () => {
      describe('non existing jogging entry', () => {

        // TODO check if this endpoint makes sense
        it('should return 404 (Not Found)', () => {
          return request.put(`${JOGGING_ROUTE}/100`)
            .auth(accessToken, { type: 'bearer' })
            .send(validJoggingEntriesToInsert[0])
            .expect(HttpStatus.NOT_FOUND);
        });
      });

      // TODO Test jogging weekly report
      // TODO Test jogging entry with weather set
      // TODO Test replacing existing entry
      // TODO Test changing location to see if weather api was called
    });

    describe(`${JOGGING_ROUTE}/:id (PATCH)`, () => {
      describe('non existing joggingEntry', () => {
        it('should return 404 (Not Found)', () => {
          return request.patch(`${JOGGING_ROUTE}/100`)
            .auth(accessToken, { type: 'bearer' })
            .send(validJoggingEntriesToInsert[0])
            .expect(HttpStatus.NOT_FOUND);
        });
      });

      // TODO Test jogging weekly report
      // TODO Test jogging entry with weather set
      // TODO Test updating existing entry
      // TODO Test changing location to see if weather api was called
    });

    describe(`${JOGGING_ROUTE}/:id (DELETE)`, () => {
      describe('non existing joggingEntry', () => {
        it('should return 404 (Not Found)', () => {
          return request.delete(`${JOGGING_ROUTE}/100`)
            .auth(accessToken, { type: 'bearer' })
            .expect(HttpStatus.NOT_FOUND);
        });
      });

      // TODO Test jogging weekly report
      // TODO Test deleting existing entry
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

  const insertJoggingEntriesIntoRepository = async () => {
    await insertUserInRepository();
    validJoggingEntriesToInsert.forEach(joggingEntry => joggingEntry.userId = validUserToInsert.id);
    await joggingEntryRepository.insert(validJoggingEntriesToInsert);
  };
});
