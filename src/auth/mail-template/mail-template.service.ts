import { Injectable } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { MailData } from '@sendgrid/helpers/classes/mail';
import { ConfigService } from 'config';
import { MailService } from 'mail';
import { User } from 'users';
import { ACCOUNT_VALIDATION_MAIL_TEMPLATE_ID, DEFAULT_MAIL_SENDER_ADDRESS, INVITATION_MAIL_TEMPLATE_ID } from './mail-template.constants';

@Injectable()
export class MailTemplateService {
  private readonly applicationHost: string;
  private readonly mailSender: string;
  private readonly accountValidationTemplateId: string;
  private readonly userInvitationTemplateId: string;

  constructor(private readonly mailService: MailService,
              private readonly config: ConfigService,
              private httpAdapter: HttpAdapterHost) {
    this.mailSender = config.get(DEFAULT_MAIL_SENDER_ADDRESS);
    this.accountValidationTemplateId = config.get(ACCOUNT_VALIDATION_MAIL_TEMPLATE_ID);
    this.userInvitationTemplateId = config.get(INVITATION_MAIL_TEMPLATE_ID);
  }

  async sendInvitationMail(userMail: string, accountCreationUrl: string) {
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

  async sendAccountValidationMail(user: User, validationUrl: string) {
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
}
