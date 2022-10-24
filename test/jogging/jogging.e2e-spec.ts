import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'app.module';
import { JoggingEntry } from 'jogging';
import { MailService } from 'mail';
import { SeederModule, SeederService } from 'seeder';
import { anyString, instance, mock, when } from 'ts-mockito';
import { Repository } from 'typeorm';
import { WeatherProviderService } from 'weather';
import { USERS_ROUTE } from '../constants';
import { getAccessToken } from '../utils/helper.functions';

import req = require('supertest');
import { getRepositoryToken } from '@nestjs/typeorm';

const USER_ID = 3;
const JOGGING_ROUTE = `${USERS_ROUTE}/${USER_ID}/jogging-entries`;

describe('JoggingController (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let seederService: SeederService;
  let joggingEntryRepository: Repository<JoggingEntry>;
  let request: req.SuperTest<req.Test>;
  let accessToken: string;
  let validJoggingEntriesToInsert: JoggingEntry[];
  let mailService: MailService;
  let weatherService: WeatherProviderService;

  jest.setTimeout(10000);

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
    joggingEntryRepository = app.get(getRepositoryToken(JoggingEntry));

    await app.init();

    request = req(app.getHttpServer());
  });

  beforeEach(async () => {
    await joggingEntryRepository.manager.connection.synchronize(true);

    await seederService.seed();

    when(weatherService.getWeatherCondition(anyString(), anyString(), anyString())).thenResolve({ description: 'sunny', location: 'Sao Paulo' });

    accessToken = await getAccessToken(request, seederService.getAdminUserCredentials());

    validJoggingEntriesToInsert = [
      { location: 'Sao Paulo', distance: 70, duration: '00:01:00', date: '2019-10-05', time: '13:34:30', userId: USER_ID },
      { location: 'New York', distance: 345, duration: '00:05:00', date: '2019-10-05', time: '13:34:35', userId: USER_ID },
      { location: 'Las Vegas', distance: 235, duration: '00:03:30', date: '2019-10-05', time: '13:34:38', userId: USER_ID },
      { location: 'Las Vegas', distance: 235, duration: '00:03:30', date: '2019-10-06', time: '13:34:38', userId: USER_ID },
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
          const query = 'date < \'2019-10-06\' and (location = \'Las Vegas\' or distance < 300)';

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
    });
  });

  describe('Jogging entry specific routes', () => {
    describe(`${JOGGING_ROUTE}/:id (PUT)`, () => {
      describe('non existing jogging entry', () => {

        it('should return 400 (Bad Request)', () => {
          return request.put(`${JOGGING_ROUTE}/100`)
            .auth(accessToken, { type: 'bearer' })
            .send(validJoggingEntriesToInsert[0])
            .expect(HttpStatus.BAD_REQUEST);
        });
      });
    });

    describe(`${JOGGING_ROUTE}/:id (PATCH)`, () => {
      describe('non existing joggingEntry', () => {
        it('should return 400 (Bad Request)', () => {
          return request.patch(`${JOGGING_ROUTE}/100`)
            .auth(accessToken, { type: 'bearer' })
            .send(validJoggingEntriesToInsert[0])
            .expect(HttpStatus.BAD_REQUEST);
        });
      });
    });

    describe(`${JOGGING_ROUTE}/:id (DELETE)`, () => {
      describe('non existing joggingEntry', () => {
        it('should return 404 (Not Found)', () => {
          return request.delete(`${JOGGING_ROUTE}/100`)
            .auth(accessToken, { type: 'bearer' })
            .expect(HttpStatus.NOT_FOUND);
        });
      });
    });
  });

  afterAll(async () => {
    await app.close();
    await moduleFixture.close();
  });

  const insertJoggingEntriesIntoRepository = async () => {
    validJoggingEntriesToInsert.forEach(entry => entry.weatherCondition = 'sunny');
    await joggingEntryRepository.insert(validJoggingEntriesToInsert);
  };
});
