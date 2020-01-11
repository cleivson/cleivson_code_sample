import { createParamDecorator } from '@nestjs/common';
import { PARSED_QUERY_REQUEST_KEY } from './request.constants';

export const ParsedQuery = createParamDecorator(
  (_, req): ParameterDecorator => {
    return req.query[PARSED_QUERY_REQUEST_KEY];
  },
);
