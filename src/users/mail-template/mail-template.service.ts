import { Injectable } from '@nestjs/common';
import { MailData } from '@sendgrid/helpers/classes/mail';
import { ConfigService } from 'config';
import { MailService } from 'mail';
import * as url from 'url';
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

  async sendInvitationMail(userMail: string, inviteToken: string) {
    const accountCreationUrl: string = this.getAcceptInvitationUrl(inviteToken);

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

  async sendAccountValidationMail(userEmail: string, verificationToken: string) {
    const validationUrl = this.getValidationUrl(userEmail, verificationToken);

    const mailToSend: MailData = {
      from: this.mailSender,
      templateId: this.accountValidationTemplateId,
      personalizations: [
        {
          to: userEmail,
          dynamicTemplateData: {
            validationUrl,
          },
        },
      ],
    };

    await this.mailService.sendMail(mailToSend);
  }

  private getAcceptInvitationUrl(inviteToken: string): string {
    const urlObject: url.UrlObject = {
      host: this.config.getPublicClientUrl(),
      pathname: '/invite/validate',
      query: { token: inviteToken },
    };

    const accountCreationUrl = url.format(urlObject);

    return accountCreationUrl;
  }

  private getValidationUrl(userEmail: string, verificationToken: string): string {
    const urlObject: url.UrlObject = {
      host: this.config.getPublicServerUrl(),
      pathname: '/account/verify',
      query: { token: verificationToken, userEmail },
    };

    return url.format(urlObject);
  }
}
