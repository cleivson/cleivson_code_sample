import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '../config';
import { CONFIG_FILE_PATH } from '../config/providers.constants';
import { MailService } from './mail.service';

describe('MailService', () => {
  let service: MailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        ConfigService,
        {
          provide: CONFIG_FILE_PATH,
          useValue: '.env.test',
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
