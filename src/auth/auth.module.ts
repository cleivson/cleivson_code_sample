import { Module } from '@nestjs/common';
import { BasicAuthenticationModule } from './basic';

@Module({
  imports: [BasicAuthenticationModule],
})
export class AuthModule {}
