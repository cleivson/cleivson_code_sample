import { AdvancedQuery } from 'query';
import { CombinationExpression, CombinationOperator, FilterExpression, FilterOperator } from 'query/conditions';
import { PrettyPrinterVisitor } from './pretty-printer.visitor';

describe('PrettyPrinter Query Visitor', () => {
  const visitor = new PrettyPrinterVisitor();

  describe('visit', () => {
    const firstExpression: FilterExpression<TestFilterEntity> = new FilterExpression('firstProperty', FilterOperator.Equals, 'test');
    const secondExpression: FilterExpression<TestFilterEntity> = new FilterExpression('secondProperty', FilterOperator.GreaterThan, 'test2');
    const thirdExpression: FilterExpression<TestFilterEntity> = new FilterExpression('secondProperty', FilterOperator.NotEquals, 'foo');
    const andExpression = new CombinationExpression(firstExpression, CombinationOperator.And, secondExpression);
    const orExpression = new CombinationExpression(andExpression, CombinationOperator.Or, thirdExpression);
    const query = new AdvancedQuery<TestFilterEntity>(orExpression);

    it('should generate formatted string', () => {
      query.accept(visitor);

      const formattedQuery = visitor.getFormattedQuery();
      expect(formattedQuery).toEqual('(firstProperty eq test and secondProperty gt test2) or secondProperty ne foo');
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
