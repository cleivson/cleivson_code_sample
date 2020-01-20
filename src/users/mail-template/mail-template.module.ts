import { Module } from '@nestjs/common';
import { MailTemplateService } from './mail-template.service';

@Module({
  providers: [MailTemplateService],
  exports: [MailTemplateService],
})
export class MailTemplateModule { }
