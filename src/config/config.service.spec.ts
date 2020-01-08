import { Test, TestingModule } from '@nestjs/testing';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { ConfigService } from './config.service';
import { CONFIG_FILE_PATH } from './providers.constants';

jest.mock('fs');
jest.mock('dotenv');

describe('ConfigService', () => {
  const configFilePath = 'testfilepath';
  const configFileContent = 'testfilecontent';
  const configRecords: Record<string, string> = { test: 'testValue' };

  let service: ConfigService;
  let readFileSyncMock: jest.SpyInstance;
  let parseMock: jest.SpyInstance;

  beforeEach(async () => {
    readFileSyncMock = jest.spyOn(fs, 'readFileSync');
    readFileSyncMock.mockImplementationOnce(() => configFileContent);

    parseMock = jest.spyOn(dotenv, 'parse');
    parseMock.mockImplementation(() => {
      return configRecords;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigService,
        {
          provide: CONFIG_FILE_PATH,
          useValue: '.env.test',
        },
      ],
    }).compile();

    service = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    readFileSyncMock.mockRestore();
    parseMock.mockRestore();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should read config file', () => {
      // tslint:disable-next-line:no-unused-expression
      new ConfigService(configFilePath);

      expect(readFileSyncMock).toHaveBeenCalledWith(configFilePath);
    });

    it('should parse config file', () => {
      // tslint:disable-next-line:no-unused-expression
      new ConfigService(configFilePath);

      expect(parseMock).toHaveBeenCalledWith(configFileContent);
    });
  });

  describe('get', () => {
    describe('optional', () => {
      describe('non existing parameter', () => {
        it('should return undefined', () => {
          const configKey = 'unexistentkey';
          expect(service.get(configKey, true)).toBeUndefined();
        });
      });

      describe('existing parameter', () => {
        it('should return equivalent value', () => {
          const configKey = 'test';
          const value = service.get(configKey, true);

          expect(value).toEqual(configRecords[configKey]);
        });
      });
    });

    describe('non optional', () => {
      describe('non existing parameter', () => {
        it('should throw error', () => {
          const configKey = 'unexistentkey';
          expect(() => service.get(configKey)).toThrowError('not found');
        });
      });

      describe('existing parameter', () => {
        it('should return equivalent value', () => {
          const configKey = 'test';
          const value = service.get(configKey);

          expect(value).toEqual(configRecords[configKey]);
        });
      });
    });
  });
});
