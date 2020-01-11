import { IsDefined, IsEnum, ValidateNested } from 'class-validator';
import { AdvancedQueryVisitor } from 'query/expression-visitor.interface';
import { Expression } from './expression';
import { CombinationOperator } from './operators.constants';

/**
 * Represents an expression that is the combination of two other expressions.
 */
export class CombinationExpression<T> {
  constructor(leftCondition: Expression<T>,
              operator: CombinationOperator,
              rightCondition: Expression<T>) {
    this.leftCondition = leftCondition;
    this.operator = operator;
    this.rightCondition = rightCondition;
  }

  /**
   * The operator to combine the two child conditions.
   */
  @IsDefined()
  @IsEnum(CombinationOperator)
  operator: CombinationOperator;

  /**
   * The left side of the expression.
   */
  @IsDefined()
  @ValidateNested()
  leftCondition: Expression<T>;

  /**
   * The right side of the expression.
   */
  @IsDefined()
  @ValidateNested()
  rightCondition: Expression<T>;

  /**
   * Accepts a visitor that will go through this query expression tree to add some functionality.
   * @param visitor - The visitor going through the expression tree.
   */
  accept(visitor: AdvancedQueryVisitor<T>) {
    visitor.visitCombinationExpression(this);
  }
}
