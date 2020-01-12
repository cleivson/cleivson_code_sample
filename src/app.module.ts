import { Module, ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { AuthModule } from './auth';
import { ConfigModule } from './config';
import { DatabaseModule } from './database';
import { JoggingModule } from './jogging';
import { QueryModule } from './query';
import { SeederModule } from './seeder';
import { UserModule } from './users';

@Module({
  imports: [UserModule, AuthModule, ConfigModule, DatabaseModule, SeederModule, QueryModule, JoggingModule],
  providers: [{
    provide: APP_PIPE,
    useFactory: () => {
      return new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        forbidUnknownValues: true,
      });
    },
  }],
})
export class AppModule { }
