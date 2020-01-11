import { AdvancedQuery } from 'query';
import { CombinationExpression, CombinationOperator, FilterExpression, FilterOperator } from 'query/conditions';
import { AdvancedQueryVisitor } from 'query/expression-visitor.interface';
import { SelectQueryBuilder } from 'typeorm';

/**
 * Visits the tree expression of an AdvancedQuery to populate a Typeorm's WhereExpression.
 */
export class TypeormQueryBuilderVisitor<T> implements AdvancedQueryVisitor<T> {
  /**
   * Fills the 'where' field of the query builder with an clause corresponding to the passed query expression.
   *
   * NOTE: The original value of the 'where' clause is overriten.
   * @param query - The query to translate to the query builder.
   * @param queryBuilder - The query builder to be filled accordingly to the visited query expression.
   */
  public static applyQuery<T>(query: AdvancedQuery<T>, queryBuilder: SelectQueryBuilder<T>): void {
    if (!query) {
      return;
    }

    const queryBuilderVisitor = new TypeormQueryBuilderVisitor();
    query.accept(queryBuilderVisitor);
    queryBuilderVisitor.fillQueryBuilder(queryBuilder);
  }

  private formattedQuery: string = '';
  private queryParametersMap = {};

  /**
   * Visits the query expression generating the equivalent query in TypeOrm.
   * @param expression - The top level query to be visited.
   */
  public visitQuery(expression: AdvancedQuery<T>) {
    if (!expression || !expression.rootCondition) {
      return;
    }

    // Encapsulates the query in parentheses so it can be combined with other queries outside this visitor
    const visitAction = this.encapsulateInParentheses(() => expression.rootCondition.accept(this));

    visitAction();
  }

  public visitCombinationExpression(expression: CombinationExpression<T>) {
    if (!expression) {
      return;
    }

    let leftVisit = () => expression.leftCondition.accept(this);
    let rightVisit = () => expression.rightCondition.accept(this);

    if (expression.leftCondition instanceof CombinationExpression) {
      leftVisit = this.encapsulateInParentheses(leftVisit);
    }
    if (expression.rightCondition instanceof CombinationExpression) {
      rightVisit = this.encapsulateInParentheses(rightVisit);
    }

    leftVisit();
    this.formattedQuery += ` ${this.transformOperator(expression.operator)} `;
    rightVisit();
  }

  public visitFilterExpression(expression: FilterExpression<T>) {
    const paramName = this.getNextParameterName();

    this.formattedQuery += `${expression.field} ${this.transformOperator(expression.operator)} :${paramName}`;
    this.queryParametersMap[paramName] = expression.value;
  }

  /**
   * Fills the 'where' field of the query builder with an clause corresponding to the visited query expression.
   *
   * NOTE: The original value of the 'where' clause is overriten.
   * @param queryBuilder - The query builder to be filled accordingly to the visited query expression.
   */
  public fillQueryBuilder(queryBuilder: SelectQueryBuilder<T>) {
    queryBuilder.where(this.formattedQuery, this.queryParametersMap);
  }

  private encapsulateInParentheses(visitAction: () => void) {
    return () => {
      this.formattedQuery += '(';
      visitAction();
      this.formattedQuery += ')';
    };
  }

  private transformOperator(operator: CombinationOperator | FilterOperator): string {
    switch (operator) {
      case CombinationOperator.And:
        return 'AND';
      case CombinationOperator.Or:
        return 'OR';
      case FilterOperator.Equals:
        return '=';
      case FilterOperator.NotEquals:
        return '<>';
      case FilterOperator.GreaterThan:
        return '>';
      case FilterOperator.LowerThan:
        return '<';
      default:
        throw new Error(`Unsupported operator ${operator}.`);
    }
  }

  private getNextParameterName(): string {
    return 'param' + (Object.getOwnPropertyNames(this.queryParametersMap).length + 1);
  }
}
