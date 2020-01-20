import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailTemplateModule } from 'users/mail-template';
import { User, VerificationToken } from './model';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { VerificationService } from './verification.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, VerificationToken]),
    MailTemplateModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, Logger, VerificationService],
  exports: [UsersService],
})
export class UserModule { }
