import { Module } from '@nestjs/common';
import { UserModule } from 'users';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { BasicAuthenticationModule } from './basic';
import { JwtStrategyModule } from './jwt';

@Module({
  imports: [BasicAuthenticationModule, JwtStrategyModule, UserModule],
  providers: [AccountService],
  controllers: [AccountController],
})
export class AuthModule {}
