import { Test, TestingModule } from '@nestjs/testing';
import { JoggingEntry } from '../model';
import { WeeklyReportGenerator } from './weekly-report-generator';

describe('WeeklyReportGenerator', () => {
  let service: WeeklyReportGenerator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WeeklyReportGenerator],
    }).compile();

    service = module.get<WeeklyReportGenerator>(WeeklyReportGenerator);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generate report for', () => {
    let validEntry: JoggingEntry;

    beforeEach(() => {
      validEntry = createValidEntry();
    });

    describe('empty jogging entries', () => {
      it('should return empty', () => {
        const reportEntries = service.generate([]);
        expect(reportEntries).toHaveLength(0);
      });
    });

    describe('undefined jogging entries', () => {
      it('should return empty', () => {
        const reportEntries = service.generate(undefined);
        expect(reportEntries).toHaveLength(0);
      });
    });

    describe('null jogging entries', () => {
      it('should return empty', () => {
        const reportEntries = service.generate(null);
        expect(reportEntries).toHaveLength(0);
      });
    });

    describe('entry in last week of the year', () => {
      describe('with 4 or more days', () => {
        it('should be considered as same year', () => {
          const joggingEntries: JoggingEntry[] = [
            { ...validEntry, date: '2020-12-31' },
          ];

          const reportEntries = service.generate(joggingEntries);

          expect(reportEntries[0].week).toBe('53-2020');
        });
      });

      describe('with less than 4 days', () => {
        it('should be considered as first week of next year', () => {
          const joggingEntries: JoggingEntry[] = [
            { ...validEntry, date: '2019-12-31' },
          ];

          const reportEntries = service.generate(joggingEntries);

          expect(reportEntries[0].week).toBe('01-2020');
        });
      });
    });

    describe('entry in first week of the year', () => {
      describe('with 4 or more days', () => {
        it('should be considered as same year', () => {
          const joggingEntries: JoggingEntry[] = [
            { ...validEntry, date: '2020-01-01' },
          ];

          const reportEntries = service.generate(joggingEntries);

          expect(reportEntries[0].week).toBe('01-2020');
        });
      });

      describe('with less than 4 days', () => {
        it('should be considered as last week of previous year', () => {
          const joggingEntries: JoggingEntry[] = [
            { ...validEntry, date: '2021-01-01' },
          ];

          const reportEntries = service.generate(joggingEntries);

          expect(reportEntries[0].week).toBe('53-2020');
        });
      });
    });

    describe('entries in same week', () => {
      it('should be aggregated in same report entry', () => {
        const joggingEntry1: JoggingEntry = { ...validEntry, date: '2019-12-30' };
        const joggingEntry2: JoggingEntry = { ...validEntry, date: '2020-01-05' };

        const reportEntries = service.generate([joggingEntry1, joggingEntry2]);
        expect(reportEntries).toHaveLength(1);
      });
    });

    describe('entries in different weeks', () => {
      it('should be in different report entries', () => {
        const joggingEntry1: JoggingEntry = { ...validEntry, date: '2019-12-29' };
        const joggingEntry2: JoggingEntry = { ...validEntry, date: '2020-01-04' };

        const reportEntries = service.generate([joggingEntry1, joggingEntry2]);
        expect(reportEntries).toHaveLength(2);
      });
    });

    describe('valid entries', () => {
      it('should aggregate values by week', () => {
        const week52 = '52-2019';
        const expectedWeek52AvgDistance = 3000;
        const expectedWeek52AvgSpeed = 8;

        const firstEntryOfWeek52: JoggingEntry = { ...validEntry, date: '2019-12-28', distance: 5000, duration: '00:30:00' };
        const secondEntryOfWeek52: JoggingEntry = { ...validEntry, date: '2019-12-29', distance: 1000, duration: '00:15:00' };

        const week1 = '01-2020';
        const expectedWeek1AvgDistance = 12000;
        const expectedWeek1AvgSpeed = 12;

        const firstEntryOfWeek1: JoggingEntry = { ...validEntry, date: '2020-01-01', distance: 11000, duration: '01:00:00' };
        const secondEntryOfWeek1: JoggingEntry = { ...validEntry, date: '2020-01-01', distance: 13000, duration: '01:00:00' };

        const joggingEntries = [firstEntryOfWeek52, secondEntryOfWeek52, firstEntryOfWeek1, secondEntryOfWeek1];

        const reportEntries = service.generate(joggingEntries);

        const week52Report = reportEntries.find(entry => entry.week === week52);
        expect(week52Report).toBeDefined();
        expect(week52Report.averageDistance).toBe(expectedWeek52AvgDistance);
        expect(week52Report.averageSpeed).toBe(expectedWeek52AvgSpeed);

        const week1Report = reportEntries.find(entry => entry.week === week1);
        expect(week1Report).toBeDefined();
        expect(week1Report.averageDistance).toBe(expectedWeek1AvgDistance);
        expect(week1Report.averageSpeed).toBe(expectedWeek1AvgSpeed);
      });
    });
  });
});

const createValidEntry = (): JoggingEntry => {
  return { date: '2019-12-31', time: '8:00:00', location: 'Sao Paulo', duration: '00:10:00', distance: 1700, userId: 1 };
};
