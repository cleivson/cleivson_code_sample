import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from 'config';
import { MailTemplateModule } from 'users/mail-template';
import { UserModule } from 'users';
import { JWT_SECRET_CONFIG_KEY, JWT_TOKEN_EXPIRATION_CONFIG_KEY } from './invite.constants';
import { InviteController } from './invite.controller';
import { InviteService } from './invite.service';

@Module({
  imports: [
    UserModule,
    MailTemplateModule,
    registerJwtModule(),
  ],
  providers: [InviteService],
  controllers: [InviteController],
  exports: [InviteService],
})
export class InviteModule { }

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
