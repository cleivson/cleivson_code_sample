import { BadRequestException, Injectable } from '@nestjs/common';
import { Grammar, Parser } from 'nearley';
import { AdvancedQuery } from 'query';
import grammar from './grammar';

@Injectable()
export class AdvancedQueryParser {
  private readonly compiledGrammar: Grammar;

  constructor() {
    this.compiledGrammar = Grammar.fromCompiled(grammar);
  }

  parse<T = any>(rawQuery: string): AdvancedQuery<T> {
    if (!rawQuery) {
      return undefined;
    }

    const parser = new Parser(this.compiledGrammar);

    try {
      parser.feed(rawQuery);
    } catch (e) {
      throw new BadRequestException('Bad formed query expression');
    }

    const results = parser.finish();

    if (results.length === 0) {
      throw new BadRequestException('Incomplete query expression');
    }

    return results[0];
  }
}
