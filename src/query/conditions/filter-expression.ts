import { IsDefined, IsEnum } from 'class-validator';
import { AdvancedQueryVisitor } from 'query/expression-visitor.interface';
import { FilterOperator } from './operators.constants';

/**
 * Represents an expression to filter an entity based in one of its properties.
 */
export class FilterExpression<T> {
  constructor(field: keyof T, operator: FilterOperator, value: any) {
    this.field = field;
    this.operator = operator;
    this.value = value;
  }

  /**
   * The comparison operator to filter the entity field.
   */
  @IsDefined()
  @IsEnum(FilterOperator)
  operator: FilterOperator;

  /**
   * The field to be used in filter.
   */
  @IsDefined()
  field: keyof T;

  /**
   * The value to be compared to 'field' when filtering the entity.
   */
  @IsDefined()
  value: any;

  /**
   * Accepts a visitor that will go through this query expression tree to add some functionality.
   * @param visitor - The visitor going through the expression tree.
   */
  accept(visitor: AdvancedQueryVisitor<T>) {
    visitor.visitFilterExpression(this);
  }
}
