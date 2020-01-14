import { Module } from '@nestjs/common';
import { UserModule } from 'users';
import { AccountController } from './account.controller';
import { BasicAuthenticationModule } from './basic';
import { JwtStrategyModule } from './jwt';

@Module({
  imports: [BasicAuthenticationModule, JwtStrategyModule, UserModule],
  controllers: [AccountController],
})
export class AuthModule {}
