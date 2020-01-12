import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategyModule } from 'auth/jwt';
import { UserModule } from 'users';
import { BasicPassportStrategy } from './basic-passport-strategy';
import { BasicAuthenticationController } from './basic.controller';

/**
 * Module for Passport Jwt authentication strategy.
 */
@Module({
  imports: [PassportModule, UserModule, JwtStrategyModule],
  providers: [BasicPassportStrategy],
  controllers: [BasicAuthenticationController],
})
export class BasicAuthenticationModule { }