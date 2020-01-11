/**
 * Represents the operators that can be used in an AdvancedQuery to combine two conditions.
 */
export enum CombinationOperator {
  Or = 'or',
  And = 'and',
}

/**
 * Represents the operators that can be used in an AdvancedQuery to filter the queried entity.
 */
export enum FilterOperator {
  Equals = 'eq',
  NotEquals = 'ne',
  GreaterThan = 'gt',
  LowerThan = 'lt',
}
