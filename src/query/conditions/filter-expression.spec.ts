import { AdvancedQueryVisitor } from 'query/expression-visitor.interface';
import { instance, mock, verify } from 'ts-mockito';
import { FilterExpression } from './filter-expression';
import { FilterOperator } from './operators.constants';

describe('FilterExpression', () => {
  const filterExpression: FilterExpression<TestFilterEntity> = new FilterExpression('firstProperty', FilterOperator.Equals, 'test');

  describe('accept', () => {
    it('should call visit method of visitor', () => {
      const visitorMock = mock<AdvancedQueryVisitor<TestFilterEntity>>();

      filterExpression.accept(instance(visitorMock));

      verify(visitorMock.visitFilterExpression(filterExpression)).called();
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
