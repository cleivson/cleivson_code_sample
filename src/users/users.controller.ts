import { ClassSerializerInterceptor, Controller, ForbiddenException, Get, Param, ParseIntPipe, Patch, Post, Put, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Crud, CrudController, CrudRequest, GetManyDefaultResponse, Override, ParsedBody, ParsedRequest } from '@nestjsx/crud';
import { LoggedUser } from 'auth';
import { propertyOf, throwIfBodyOverridesPath } from 'common';
import { ParsedQuery } from 'query';
import { AdvancedQuery } from 'query/advanced-query';
import { Roles } from './decorators';
import { LoggedUserDto } from './dto';
import { RolesGuard } from './guards';
import { User, UserRoles } from './model';
import { UsersService } from './users.service';

@Crud({
  model: {
    type: User,
  },
  routes: {
    exclude: ['createManyBase'],
  },
  query: {
    exclude: [
      propertyOf<User>('passwordHash'),
    ],
  },
  validation: {
    transform: true,
  },
})
@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
@Roles(UserRoles.Admin, UserRoles.UserManager, UserRoles.User)
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
@ApiTags('Users')
export class UsersController implements CrudController<User> {
  constructor(readonly service: UsersService) { }

  get base(): CrudController<User> {
    return this;
  }

  @Get()
  @Roles(UserRoles.Admin, UserRoles.UserManager)
  @ApiOperation({ summary: 'Get many Users' })
  @ApiQuery({ name: 'query', type: 'string', required: false })
  @Override()
  async getMany(@ParsedRequest() req: CrudRequest, @ParsedQuery() query: AdvancedQuery<User>): Promise<GetManyDefaultResponse<User> | User[]> {
    return this.service.getUsers(req, query);
  }

  @Post()
  @Roles(UserRoles.Admin, UserRoles.UserManager)
  @Override()
  async createOne(@ParsedRequest() req: CrudRequest, @ParsedBody() dto: User, @LoggedUser() loggedUser: LoggedUserDto): Promise<Partial<User>> {
    this.checkPermission(loggedUser, dto);

    return this.service.createUser(dto);
  }

  @Override()
  async getOne(@ParsedRequest() req, @LoggedUser() loggedUser: LoggedUserDto): Promise<void | User> {
    const resultUser = await this.base.getOneBase(req);

    this.checkPermission(loggedUser, resultUser);

    return resultUser;
  }

  @Override()
  async deleteOne(@ParsedRequest() req, @LoggedUser() loggedUser: LoggedUserDto, @Param('id', ParseIntPipe) idToDelete): Promise<void | User> {
    const existingUser = await this.service.getOne(req);

    this.checkPermission(loggedUser, existingUser);

    return this.service.deleteUser(idToDelete);
  }

  @Put()
  @Override()
  async replaceOne(@ParsedRequest() req: CrudRequest,
                   @ParsedBody() dto: User,
                   @LoggedUser() loggedUser: LoggedUserDto,
                   @Param('id', ParseIntPipe) paramId): Promise<Partial<User>> {
    throwIfBodyOverridesPath(req, dto);

    this.checkPermission(loggedUser, dto);

    const existingUser = await this.service.getOne(req);

    this.checkPermission(loggedUser, existingUser);

    return this.service.saveUser(dto);
  }

  @Patch()
  @Override()
  async updateOne(@ParsedRequest() req: CrudRequest,
                  @ParsedBody() dto: User,
                  @LoggedUser() loggedUser: LoggedUserDto,
                  @Param('id', ParseIntPipe) paramId): Promise<Partial<User>> {
    throwIfBodyOverridesPath(req, dto);

    this.checkPermission(loggedUser, dto);

    const existingUser = await this.service.getOne(req);

    this.checkPermission(loggedUser, existingUser);

    const userToUpdate = Object.assign(new User(), existingUser, dto);

    return this.service.updateUser(userToUpdate);
  }

  private checkPermission(loggedUser: LoggedUserDto, userToBeModified: User) {
    if (userToBeModified) {
      const managerTryingToEditAdmin = loggedUser.role === UserRoles.UserManager && userToBeModified.role === UserRoles.Admin;
      const regularUserTryingToEditAnotherUser = this.isRegularUserEditingOtherUser(loggedUser, userToBeModified.id);

      if (managerTryingToEditAdmin || regularUserTryingToEditAnotherUser) {
        throw new ForbiddenException();
      }
    }
  }

  private isRegularUserEditingOtherUser(loggedUser: LoggedUserDto, pathUserId: number) {
    return loggedUser.role === UserRoles.User && pathUserId !== loggedUser.id;
  }
}
