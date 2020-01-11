@preprocessor typescript
@builtin "whitespace.ne"  # `_` means optional arbitrary amount of whitespace and `__` means mandatory at least one whitespace
@builtin "number.ne"      # `int`, `jsonfloat`
@builtin "string.ne"      # `dqstring` (double quoted string), `sqstring` (single quoted string)

@{%
import { AdvancedQuery } from 'query';
import { CombinationExpression, CombinationOperator, FilterExpression, FilterOperator } from 'query/conditions';
%}

# Based on the example in https://github.com/kach/nearley/blob/master/examples/calculator/arithmetic.ne

# The grammar must represent a query expression that contains filter conditions, aggregation operators (AND, OR) 
# and that can use parentheses to define precedence

query             -> _ OR_CONDITION _                                             {% (d) => new AdvancedQuery(d[1]) %}

OR_CONDITION      -> OR_CONDITION __ or_operator __ AND_CONDITION                 {% (d) => new CombinationExpression<any>(d[0], d[2], d[4]) %}
                  | AND_CONDITION                                                 {% id %}

AND_CONDITION     -> AND_CONDITION __ and_operator __ PARENTHESES                 {% (d) => new CombinationExpression<any>(d[0], d[2], d[4]) %}
                  | PARENTHESES                                                   {% id %}

PARENTHESES       -> "(" _ OR_CONDITION _ ")"                                     {% function(d) { return d[2]; } %}
                  | FILTER_CONDITION                                              {% id %}

FILTER_CONDITION  -> field __ filter_operator __ value                            {% (d) => new FilterExpression<any>(d[0], d[2], d[4]) %}

# We use 'i' after the operator name to make it case insensitive
filter_operator   -> "eq"i          {% (d) => FilterOperator.Equals %}
                  | "="             {% (d) => FilterOperator.Equals %}
                  | "ne"i           {% (d) => FilterOperator.NotEquals %}
                  | "!="            {% (d) => FilterOperator.NotEquals %}
                  | "gt"i           {% (d) => FilterOperator.GreaterThan %}
                  | ">"             {% (d) => FilterOperator.GreaterThan %}
                  | "lt"i           {% (d) => FilterOperator.LowerThan %}
                  | "<"             {% (d) => FilterOperator.LowerThan %}

and_operator      -> "AND"i         {% (d) => CombinationOperator.And %}
or_operator       -> "OR"i          {% (d) => CombinationOperator.Or %}

# For simplicity, we consider any contiguous string as a valid identifier and let the semantic validation
# decide if the identifier is part of the object or not
field             -> [\w]:+         {% function(d) { return d[0].join(""); } %}

value             -> sqstring       {% id %}
                  | dqstring        {% id %}
                  | jsonfloat       {% id %}