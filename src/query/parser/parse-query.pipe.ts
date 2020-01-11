import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { AdvancedQuery } from 'query';
import { AdvancedQueryParser } from './advanced-query.parser';

@Injectable()
export class ParseQueryPipe<T> implements PipeTransform<string, AdvancedQuery<T> | string> {
  constructor(private readonly parser: AdvancedQueryParser) { }

  transform(value: string, metadata: ArgumentMetadata) {
    if (metadata.type !== 'custom' || metadata.metatype !== AdvancedQuery) {
      return value;
    }

    return this.parser.parse(value);
  }
}
