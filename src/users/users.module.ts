import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailTemplateService } from './mail-template';
import { User, VerificationToken } from './model';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { VerificationService } from './verification.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, VerificationToken])],
  controllers: [UsersController],
  providers: [UsersService, Logger, VerificationService, MailTemplateService],
  exports: [UsersService],
})
export class UserModule { }
