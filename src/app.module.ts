import { Module, ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ConfigModule } from 'config';
import { DatabaseModule } from 'database';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './users';

@Module({
  imports: [UserModule, ConfigModule, DatabaseModule, AuthModule],
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
