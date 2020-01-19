import { ForbiddenException } from '@nestjs/common';
import { CrudRequest } from '@nestjsx/crud';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { throwIfBodyOverridesPath } from 'common';
import { LoggedUserDto, User, UserRoles } from '.';

/**
 * Checks if an user can make a modification to an existing user.
 * @param req The update request being validated.
 * @param dto The new user value from the request.
 * @param loggedUser The current logged user.
 * @param paramId The userId from the path parameter.
 * @param usersService The user repository used to check for previous values.
 */
export const checkPermissionToUpdate =
  async (req: CrudRequest, dto: User, loggedUser: LoggedUserDto, paramId: number, usersService: TypeOrmCrudService<User>) => {
    throwIfBodyOverridesPath(req, dto);

    checkPermission(loggedUser, dto);

    const existingUser = await usersService.findOne(paramId);

    if (existingUser) {
      checkPermission(loggedUser, existingUser);
    }
  };

/**
 * Checks if the current logged user is allowed to make a modification to a specific user.
 * @param loggedUser The current logged user trying to make an edit action.
 * @param userToBeModified The user being modified.
 * @throws ForbiddenException if the logged user cannot edit the target user.
 */
export const checkPermission = (loggedUser: LoggedUserDto, userToBeModified: User) => {
  if (userToBeModified) {
    const managerTryingToEditAdmin = loggedUser.role === UserRoles.UserManager && userToBeModified.role === UserRoles.Admin;
    const regularUserTryingToEditAnotherUser = isRegularUserEditingOtherUser(loggedUser, userToBeModified.id);

    if (managerTryingToEditAdmin || regularUserTryingToEditAnotherUser) {
      throw new ForbiddenException();
    }
  }
};

/**
 * Checks if the logged user is a regular user and is trying to access a route from a different user.
 * @param loggedUser The current logged user trying to make an edit action.
 * @param pathUserId The userId contained in the path parameter of the request.
 */
const isRegularUserEditingOtherUser = (loggedUser: LoggedUserDto, pathUserId: number) => {
  return loggedUser.role === UserRoles.User && pathUserId !== loggedUser.id;
};
