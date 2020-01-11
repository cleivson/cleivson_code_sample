import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { LoggedUserDto } from 'users';
import { NEEDED_ROLE_METADATA } from '../decorators/roles.constants';
import { UserRoles } from '../model/users.roles';

/**
 * Guard that controls access to endpoints only for users with the needed roles.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const roles = this.getNecessaryRoles(context);

    if (!this.hasRole(roles)) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: LoggedUserDto = request.user;

    return user && user.role && roles.includes(user.role);
  }

  private getNecessaryRoles(context: ExecutionContext): UserRoles[] {
    const endpointRoles = this.getEndpointRoles(context);
    return this.hasRole(endpointRoles) ? endpointRoles
      : this.getControllerRoles(context);
  }

  /**
   * Extracts the needed roles specific of the called endpoint.
   *
   * @param context - The execution context of the API call.
   */
  private getControllerRoles(context: ExecutionContext): UserRoles[] {
    return this.reflector.get<UserRoles[]>(NEEDED_ROLE_METADATA, context.getClass());
  }

  /**
   * Extracts the default needed roles that should be applied to all endpoints of called controller.
   *
   * @param context - The execution context of the API call.
   */
  private getEndpointRoles(context: ExecutionContext): UserRoles[] {
    return this.reflector.get<UserRoles[]>(NEEDED_ROLE_METADATA, context.getHandler());
  }

  private hasRole(roles: UserRoles[]) {
    return roles && roles.length > 0;
  }
}
