import { AdvancedQuery } from 'query';
import { CombinationExpression, CombinationOperator, FilterExpression, FilterOperator } from 'query/conditions';
import { AdvancedQueryVisitor } from 'query/expression-visitor.interface';
import { capture, instance, mock } from 'ts-mockito';
import { SelectQueryBuilder } from 'typeorm';
import { TypeormQueryBuilderVisitor } from './typeorm-query-builder.visitor';

describe('Typeorm Query Builder Visitor', () => {
  const firstExpression: FilterExpression<AdvancedQueryVisitor<any>> = new FilterExpression('visitQuery', FilterOperator.Equals, 'test');
  const secondExpression: FilterExpression<AdvancedQueryVisitor<any>> = new FilterExpression('visitFilterExpression', FilterOperator.GreaterThan, 'test2');
  const thirdExpression: FilterExpression<AdvancedQueryVisitor<any>> = new FilterExpression('visitCombinationExpression', FilterOperator.NotEquals, 'foo');
  const andExpression = new CombinationExpression(firstExpression, CombinationOperator.And, secondExpression);
  const orExpression = new CombinationExpression(firstExpression, CombinationOperator.Or, thirdExpression);

  describe('visit', () => {
    let visitor: TypeormQueryBuilderVisitor<AdvancedQueryVisitor<any>>;

    beforeEach(() => {
      visitor = new TypeormQueryBuilderVisitor();
    });

    describe('single filter', () => {
      it('should serialize equals correctly', () => {
        testSingleFilter(visitor, FilterOperator.Equals, '=');
      });
      it('should serialize not equals correctly', () => {
        testSingleFilter(visitor, FilterOperator.NotEquals, '<>');
      });
      it('should serialize greater than correctly', () => {
        testSingleFilter(visitor, FilterOperator.GreaterThan, '>');
      });
      it('should serialize less than correctly', () => {
        testSingleFilter(visitor, FilterOperator.LowerThan, '<');
      });
    });

    describe('combined filter', () => {
      it('should serialize and correctly', () => {
        const query = new AdvancedQuery<any>(andExpression);
        const queryBuilderMock = mock<SelectQueryBuilder<AdvancedQueryVisitor<any>>>();

        query.accept(visitor);

        visitor.fillQueryBuilder(instance(queryBuilderMock));

        const [sql, paramsMap] = capture(queryBuilderMock.where).last();

        expect(sql).toEqual('(visitQuery = :param1 AND visitFilterExpression > :param2)');
      });
      it('should serialize or correctly', () => {
        const query = new AdvancedQuery<any>(orExpression);
        const queryBuilderMock = mock<SelectQueryBuilder<AdvancedQueryVisitor<any>>>();

        query.accept(visitor);

        visitor.fillQueryBuilder(instance(queryBuilderMock));

        const [sql, paramsMap] = capture(queryBuilderMock.where).last();

        expect(sql).toEqual('(visitQuery = :param1 OR visitCombinationExpression <> :param2)');
      });
    });

    describe('more than two filter conditions', () => {
      describe('OR as top-level condition', () => {
        it('should respect precedence of expression tree', () => {
          const andCondition = new CombinationExpression<any>(firstExpression, CombinationOperator.And, secondExpression);
          const orCondition = new CombinationExpression<any>(andCondition, CombinationOperator.Or, thirdExpression);

          const query = new AdvancedQuery(orCondition);
          const queryBuilderMock = mock<SelectQueryBuilder<AdvancedQueryVisitor<any>>>();

          query.accept(visitor);

          visitor.fillQueryBuilder(instance(queryBuilderMock));

          const [sql, paramsMap] = capture(queryBuilderMock.where).last();

          expect(sql).toEqual('((visitQuery = :param1 AND visitFilterExpression > :param2) OR visitCombinationExpression <> :param3)');
          expect(paramsMap.param1).toEqual('test');
          expect(paramsMap.param2).toEqual('test2');
          expect(paramsMap.param3).toEqual('foo');
        });
      });

      describe('AND as top-level condition', () => {
        it('should respect precedence of expression tree', () => {
          const orCondition = new CombinationExpression<any>(secondExpression, CombinationOperator.Or, thirdExpression);
          const andCondition = new CombinationExpression<any>(firstExpression, CombinationOperator.And, orCondition);

          const query = new AdvancedQuery(andCondition);
          const queryBuilderMock = mock<SelectQueryBuilder<AdvancedQueryVisitor<any>>>();

          query.accept(visitor);

          visitor.fillQueryBuilder(instance(queryBuilderMock));

          const [sql, paramsMap] = capture(queryBuilderMock.where).last();

          expect(sql).toEqual('(visitQuery = :param1 AND (visitFilterExpression > :param2 OR visitCombinationExpression <> :param3))');
          expect(paramsMap.param1).toEqual('test');
          expect(paramsMap.param2).toEqual('test2');
          expect(paramsMap.param3).toEqual('foo');
        });
      });
    });
  });
});

function testSingleFilter(visitor: TypeormQueryBuilderVisitor<AdvancedQueryVisitor<any>>, operator: FilterOperator, expectedOperator: string) {
  const equalsExpression = new FilterExpression<AdvancedQueryVisitor<any>>('visitQuery', operator, 'test');
  const query = new AdvancedQuery<any>(equalsExpression);
  const queryBuilderMock = mock<SelectQueryBuilder<AdvancedQueryVisitor<any>>>();
  const param1Name = 'param1';

  query.accept(visitor);

  visitor.fillQueryBuilder(instance(queryBuilderMock));

  const [sql, paramsMap] = capture(queryBuilderMock.where).last();

  expect(sql).toEqual(`(visitQuery ${expectedOperator} :${param1Name})`);
  expect(paramsMap.hasOwnProperty(param1Name)).toBeTruthy();
  expect(paramsMap[param1Name]).toEqual('test');
}
