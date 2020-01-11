import { AdvancedQuery } from './advanced-query';
import { CombinationExpression, FilterExpression } from './conditions';

/**
 * Represents a visitor that can add operations that navigate through the expression tree of an AdvancedQuery.
 * @typeparam T the type of the entity being filtered by the visited query.
 */
export interface AdvancedQueryVisitor<T> {
  /**
   * Visits an AdvancedQuery going through its expression tree to add some functionality.
   * @param expression - The query to visit.
   */
  visitQuery(expression: AdvancedQuery<T>): any;

  /**
   * Visits a CombinationExpression going through its expression tree to add some functionality.
   * @param expression - The expression to visit.
   */
  visitCombinationExpression(expression: CombinationExpression<T>): any;

  /**
   * Visits a FilterExpression going through its expression tree to add some functionality.
   * @param expression - The expression to visit.
   */
  visitFilterExpression(expression: FilterExpression<T>): any;
}
