import { Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { AdvancedQueryParser, ParseQueryPipe } from './parser';

@Module({
  providers: [{
    provide: APP_PIPE,
    useClass: ParseQueryPipe,
  }, AdvancedQueryParser],
})
export class QueryModule { }
