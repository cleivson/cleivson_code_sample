import { AdvancedQueryVisitor } from 'query/expression-visitor.interface';
import { instance, mock, verify } from 'ts-mockito';
import { CombinationExpression } from './combination-expression';
import { FilterExpression } from './filter-expression';
import { CombinationOperator, FilterOperator } from './operators.constants';

describe('CombinationExpression', () => {
  const firstExpression: FilterExpression<TestFilterEntity> = new FilterExpression('firstProperty', FilterOperator.Equals, 'test');
  const secondExpression: FilterExpression<TestFilterEntity> = new FilterExpression('secondProperty', FilterOperator.GreaterThan, 'test2');
  const andExpression = new CombinationExpression(firstExpression, CombinationOperator.And, secondExpression);
  const orExpression = new CombinationExpression(firstExpression, CombinationOperator.Or, andExpression);

  describe('accept', () => {
    it('should call visit method of visitor', () => {
      const visitorMock = mock<AdvancedQueryVisitor<TestFilterEntity>>();

      orExpression.accept(instance(visitorMock));

      verify(visitorMock.visitCombinationExpression(orExpression)).called();
    });
  });
});

/**
 * Class to be used as filtered entity in tests of AdvancedQuery.
 */
class TestFilterEntity {
  firstProperty: string;
  secondProperty: string;
}
