import { AdvancedQuery } from 'query';
import { CombinationExpression, FilterExpression } from 'query/conditions';
import { AdvancedQueryVisitor } from 'query/expression-visitor.interface';

/**
 * Visitor to create a Pretty-Printer string representation of an AdvancedQuery.
 */
export class PrettyPrinterVisitor implements AdvancedQueryVisitor<any> {
  private formattedQuery: string = '';

  getFormattedQuery(): string {
    return this.formattedQuery;
  }

  visitQuery(expression: AdvancedQuery<any>) {
    if (expression && expression.rootCondition) {
      expression.rootCondition.accept(this);
    }
  }

  visitCombinationExpression(expression: CombinationExpression<any>) {
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
    this.formattedQuery += ` ${expression.operator} `;
    rightVisit();
  }

  visitFilterExpression(expression: FilterExpression<any>) {
    if (!expression) {
      return;
    }

    this.formattedQuery += `${expression.field.toString()} ${expression.operator} ${expression.value}`;
  }

  encapsulateInParentheses(visitAction: () => void) {
    return () => {
      this.formattedQuery += '(';
      visitAction();
      this.formattedQuery += ')';
    };
  }
}
