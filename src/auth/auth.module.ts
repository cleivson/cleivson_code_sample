import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from 'users';
import { AccountController } from './account.controller';
import { BasicAuthenticationModule } from './basic';
import { JwtStrategyModule } from './jwt';
import { MailTemplateService } from './mail-template';
import { VerificationToken } from './model';
import { VerificationService } from './verification.service';

@Module({
  imports: [TypeOrmModule.forFeature([VerificationToken]), BasicAuthenticationModule, JwtStrategyModule, UserModule],
  providers: [MailTemplateService, VerificationService],
  controllers: [AccountController],
})
export class AuthModule {}
