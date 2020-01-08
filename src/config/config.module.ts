import { Global, Module } from '@nestjs/common';
import { ConfigService } from './config.service';
import { CONFIG_FILE_PATH } from './providers.constants';

@Global()
@Module({
  providers: [
    ConfigService,
    {
      provide: CONFIG_FILE_PATH,
      useValue: `.env.${process.env.NODE_ENV || 'development'}`,
    },
  ],
  exports: [ConfigService],
})
export class ConfigModule { }
