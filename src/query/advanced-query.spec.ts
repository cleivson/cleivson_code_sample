import { instance, mock, verify } from 'ts-mockito';
import { AdvancedQuery } from './advanced-query';
import { CombinationExpression, CombinationOperator, FilterExpression, FilterOperator } from './conditions';
import { AdvancedQueryVisitor } from './expression-visitor.interface';

describe('AdvancedQuery', () => {
  const firstExpression: FilterExpression<TestFilterEntity> = new FilterExpression('firstProperty', FilterOperator.Equals, 'test');
  const secondExpression: FilterExpression<TestFilterEntity> = new FilterExpression('secondProperty', FilterOperator.GreaterThan, 'test2');
  const andExpression = new CombinationExpression(firstExpression, CombinationOperator.And, secondExpression);

  it('should allow filter expression as root', () => {
    const query = new AdvancedQuery(firstExpression);
    expect(query).toBeDefined();
  });

  it('should allow combination expression as root', () => {
    const query = new AdvancedQuery(andExpression);
    expect(query).toBeDefined();
  });

  describe('accept', () => {
    it('should call visit method of visitor', () => {
      const visitorMock = mock<AdvancedQueryVisitor<TestFilterEntity>>();

      const query = new AdvancedQuery(andExpression);
      query.accept(instance(visitorMock));

      verify(visitorMock.visitQuery(query)).called();
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
