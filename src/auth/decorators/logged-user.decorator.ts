import { createParamDecorator } from '@nestjs/common';

export const LoggedUser = createParamDecorator(
  (_, req): ParameterDecorator => {
    return req.user;
  },
);
