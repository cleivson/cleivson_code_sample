import { Injectable } from '@nestjs/common';
import { MailData } from '@sendgrid/helpers/classes/mail';
import * as sendgrid from '@sendgrid/mail';
import { ConfigService } from 'config';
import { SENDGRID_API_KEY } from './mail.constants';

@Injectable()
export class MailService {

  constructor(private readonly config: ConfigService) {
    sendgrid.setApiKey(config.get(SENDGRID_API_KEY));
  }

  async sendMail(mailRequest: MailData) {
    await sendgrid.send(mailRequest);
  }
}
