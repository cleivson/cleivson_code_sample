import { Injectable } from '@nestjs/common';
import { MailData } from '@sendgrid/helpers/classes/mail';
import { ConfigService } from 'config';
import { MailService } from 'mail';
import * as url from 'url';
import { User, VerificationToken } from 'users/model';
import { ACCOUNT_VALIDATION_MAIL_TEMPLATE_ID, DEFAULT_MAIL_SENDER_ADDRESS, INVITATION_MAIL_TEMPLATE_ID } from './mail-template.constants';

@Injectable()
export class MailTemplateService {
  private readonly mailSender: string;
  private readonly accountValidationTemplateId: string;
  private readonly userInvitationTemplateId: string;

  constructor(private readonly mailService: MailService,
              private readonly config: ConfigService) {
    this.mailSender = config.get(DEFAULT_MAIL_SENDER_ADDRESS);
    this.accountValidationTemplateId = config.get(ACCOUNT_VALIDATION_MAIL_TEMPLATE_ID);
    this.userInvitationTemplateId = config.get(INVITATION_MAIL_TEMPLATE_ID);
  }

  async sendInvitationMail(userMail: string) {
    const accountCreationUrl: string = this.getAccountCreationUrl();

    const mailToSend: MailData = {
      from: this.mailSender,
      templateId: this.userInvitationTemplateId,
      personalizations: [
        {
          to: userMail,
          dynamicTemplateData: {
            accountCreationUrl,
          },
        },
      ],
    };

    await this.mailService.sendMail(mailToSend);
  }

  async sendAccountValidationMail(verificationToken: VerificationToken, user: User) {
    const validationUrl = this.getValidationUrl(verificationToken, user);

    const mailToSend: MailData = {
      from: this.mailSender,
      templateId: this.accountValidationTemplateId,
      personalizations: [
        {
          to: user.email,
          dynamicTemplateData: {
            validationUrl,
          },
        },
      ],
    };

    await this.mailService.sendMail(mailToSend);
  }

  private getAccountCreationUrl(): string {
    const urlObject: url.UrlObject = {
      host: this.config.getPublicClientUrl(),
      pathname: '/api/',
      hash: '#/Account/register',
    };

    const accountCreationUrl = url.format(urlObject);

    return accountCreationUrl;
  }

  private getValidationUrl(verificationToken: VerificationToken, user: User): string {
    const urlObject: url.UrlObject = {
      host: this.config.getPublicServerUrl(),
      pathname: '/account/verify',
      query: { token: verificationToken.token, email: user.email },
    };

    return url.format(urlObject);
  }
}
