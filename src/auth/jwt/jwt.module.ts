import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from 'config';
import { UserModule } from 'users';
import { JWT_SECRET_CONFIG_KEY, JWT_TOKEN_EXPIRATION_CONFIG_KEY } from './jwt.constants';
import { JwtPassportService } from './jwt.service';
import { JwtPassportStrategy } from './jwt.strategy';

/**
 * Module for Passport Jwt authentication strategy.
 */
@Module({
  imports: [
    UserModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    registerJwtModule(),
  ],
  providers: [JwtPassportStrategy, JwtPassportService],
  exports: [JwtPassportService],
})
export class JwtStrategyModule { }

function registerJwtModule() {
  return JwtModule.registerAsync({
    imports: [ConfigModule],
    useFactory: async (configService: ConfigService) => ({
      secret: configService.get(JWT_SECRET_CONFIG_KEY),
      signOptions: { expiresIn: configService.get(JWT_TOKEN_EXPIRATION_CONFIG_KEY) },
    }),
    inject: [ConfigService],
  });
}
