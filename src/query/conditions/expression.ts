import { CombinationExpression } from './combination-expression';
import { FilterExpression } from './filter-expression';

export type Expression<T> = CombinationExpression<T> | FilterExpression<T>;
