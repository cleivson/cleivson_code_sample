import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { UserModule } from 'users';
import { BasicPassportStrategy } from './basic-passport-strategy';

/**
 * Module for Passport Jwt authentication strategy.
 */
@Module({
  imports: [PassportModule, UserModule],
  providers: [BasicPassportStrategy],
})
export class BasicAuthenticationModule { }
