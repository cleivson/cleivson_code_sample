import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AdvancedQuery } from 'query';
import { CombinationExpression, CombinationOperator, FilterExpression, FilterOperator } from 'query/conditions';
import { AdvancedQueryParser } from './advanced-query.parser';

describe('AdvancedQueryParser', () => {
  let parser: AdvancedQueryParser;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdvancedQueryParser],
    }).compile();

    parser = module.get<AdvancedQueryParser>(AdvancedQueryParser);
  });

  it('should be defined', () => {
    expect(parser).toBeDefined();
  });

  describe('parse', () => {
    const validQuery = 'field eq 2';
    const sampleFieldValues = ['\'singlequote\'', '"doublequote"', 123, '\'2019-09-23\'', '\'23:00:23\''];

    describe('partial input', () => {
      it('should throw BadRequestException for partial input', () => {
        const partialQuery = validQuery.split(' ').splice(2, 1).join(' ');

        expect(() => parser.parse(partialQuery)).toThrowError(BadRequestException);
      });
    });

    describe('undefined input', () => {
      it('should return undefined', () => {
        const parsedQuery = parser.parse(undefined);
        expect(parsedQuery).toBeUndefined();
      });
    });

    describe('null input', () => {
      it('should return undefined', () => {
        const parsedQuery = parser.parse(null);
        expect(parsedQuery).toBeUndefined();
      });
    });

    describe('empty input', () => {
      it('should return undefined', () => {
        const parsedQuery = parser.parse('');
        expect(parsedQuery).toBeUndefined();
      });
    });

    it('should parse all single filters correctly', () => {
      sampleFieldValues.forEach(sampleValue => {
        Object.keys(FilterOperator).forEach(operatorName => {
          const fieldName = 'field';
          const operator = FilterOperator[operatorName];
          const query = `${fieldName} ${operator} ${sampleValue}`;

          const escapedSampleValue = escapeValue(sampleValue);

          const expectedQuery = new AdvancedQuery(new FilterExpression<any>(fieldName, operator, escapedSampleValue));

          testQuery(parser, query, expectedQuery);
        });
      });
    });

    it('should parse combination expressions correctly', () => {
      Object.keys(CombinationOperator).forEach(operatorName => {
        const operator = CombinationOperator[operatorName];
        const query = `field eq 2 ${operator} otherField gt \'test\'`;

        const leftExpression = new FilterExpression('field', FilterOperator.Equals, 2);
        const rightExpression = new FilterExpression('otherField', FilterOperator.GreaterThan, 'test');
        const expectedQuery = new AdvancedQuery(new CombinationExpression<any>(leftExpression, operator, rightExpression));

        testQuery(parser, query, expectedQuery);
      });
    });

    describe('more than two filter conditions', () => {
      const firstExpression = new FilterExpression('field', FilterOperator.Equals, 2);
      const secondExpression = new FilterExpression('otherField', FilterOperator.GreaterThan, 'test');
      const thirdExpression = new FilterExpression('thirdField', FilterOperator.LowerThan, 3.0);

      describe('without parentheses', () => {
        describe('AND condition on the left', () => {
          it('should give precedence to AND rather than OR', () => {
            const query = 'field eq 2 and otherField gt "test" or thirdField lt 3.0';

            // OR must be the root condition
            const andCondition = new CombinationExpression<any>(firstExpression, CombinationOperator.And, secondExpression);
            const orCondition = new CombinationExpression<any>(andCondition, CombinationOperator.Or, thirdExpression);

            const expectedQuery = new AdvancedQuery(orCondition);

            testQuery(parser, query, expectedQuery);
          });
        });

        describe('AND condition on the right', () => {
          it('should give precedence to AND rather than OR', () => {
            const query = 'thirdField lt 3.0 or field eq 2 and otherField gt "test"';

            // OR must be the root condition
            const andCondition = new CombinationExpression<any>(firstExpression, CombinationOperator.And, secondExpression);
            const orCondition = new CombinationExpression<any>(thirdExpression, CombinationOperator.Or, andCondition);

            const expectedQuery = new AdvancedQuery(orCondition);

            testQuery(parser, query, expectedQuery);
          });
        });
      });

      describe('with parentheses', () => {
        describe('on the left', () => {
          it('should use parentheses for precedence', () => {
            const query = '(field eq 2 and otherField gt "test") or thirdField < 3.0';

            // AND must be the root condition
            const andCondition = new CombinationExpression<any>(firstExpression, CombinationOperator.And, secondExpression);
            const orCondition = new CombinationExpression<any>(andCondition, CombinationOperator.Or, thirdExpression);

            const expectedQuery = new AdvancedQuery(orCondition);

            testQuery(parser, query, expectedQuery);
          });
        });
        describe('on the right', () => {
          it('should use parentheses for precedence', () => {
            const query = 'field eq 2 and (otherField gt "test" or thirdField < 3.0)';

            // AND must be the root condition
            const orCondition = new CombinationExpression<any>(secondExpression, CombinationOperator.Or, thirdExpression);
            const andCondition = new CombinationExpression<any>(firstExpression, CombinationOperator.And, orCondition);

            const expectedQuery = new AdvancedQuery(andCondition);

            testQuery(parser, query, expectedQuery);
          });
        });
      });
    });
  });
});

function escapeValue(value: number | string): number | string {
  if (typeof value === 'string' && (value[0] === '\'' || value[0] === '"')) {
    return value.substring(1, value.length - 1);
  } else {
    return value;
  }
}

function testQuery(parser: AdvancedQueryParser, query: string, expectedQuery: AdvancedQuery<any>) {
  const parsedQuery = parser.parse(query);
  expect(parsedQuery).toEqual(expectedQuery);

  const queryWithParentheses = `(${query})`;
  const parsedQueryWithParentheses = parser.parse(queryWithParentheses);
  expect(parsedQueryWithParentheses).toEqual(expectedQuery);
}
