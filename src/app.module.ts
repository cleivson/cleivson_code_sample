import { Module, ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { AuthModule } from './auth';
import { ConfigModule } from './config';
import { DatabaseModule } from './database';
import { InviteModule } from './invite';
import { JoggingModule } from './jogging';
import { MailModule } from './mail/mail.module';
import { QueryModule } from './query';
import { SeederModule } from './seeder';
import { UserModule } from './users';
import { UserProfilePictureModule } from './users/user-profile-picture';

@Module({
  imports: [UserModule, AuthModule, ConfigModule, DatabaseModule, SeederModule, QueryModule, JoggingModule, MailModule, InviteModule, UserProfilePictureModule],
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
