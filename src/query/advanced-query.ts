import { IsDefined, ValidateNested } from 'class-validator';
import { Expression } from './conditions';
import { AdvancedQueryVisitor } from './expression-visitor.interface';

/**
 * Represents a query that has an explicit precedence of operations.
 */
export class AdvancedQuery<T> {
  constructor(rootCondition: Expression<T>) {
    this.rootCondition = rootCondition;
  }

  @IsDefined()
  @ValidateNested()
  /**
   * The root filter expression of the query.
   */
  rootCondition: Expression<T>;

  /**
   * Accepts a visitor that will go through this query expression tree to add some functionality.
   * @param visitor - The visitor going through the expression tree.
   */
  accept(visitor: AdvancedQueryVisitor<T>) {
    visitor.visitQuery(this);
  }
}
