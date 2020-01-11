import { BadRequestException } from '@nestjs/common';
import { CrudRequest } from '@nestjsx/crud';

/**
 * Validates if a request body overrides values from the request path, meaning a security breach, and throws a BadRequestException
 *
 * @param req - The request being validated.
 * @param entity - The entity passed as body to the request.
 */
export const throwIfBodyOverridesPath = (req: CrudRequest, entity: any) => {
  if (req.parsed.paramsFilter) {
    req.parsed.paramsFilter.forEach(paramFilter => {
      const bodyValue = entity[paramFilter.field];
      if (bodyValue) {
        if (bodyValue !== paramFilter.value) {
          throw new BadRequestException('Body property cannot override path parameter.');
        }
      } else {
        entity[paramFilter.field] = paramFilter.value;
      }
    });
  }
};
