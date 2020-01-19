import { Body, Controller, ForbiddenException, Get, Param, ParseIntPipe, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Crud, CrudController, CrudRequest, CrudRequestInterceptor, Override, ParsedBody, ParsedRequest } from '@nestjsx/crud';
import { LoggedUser } from 'auth/decorators/logged-user.decorator';
import { propertyOf, throwIfBodyOverridesPath } from 'common';
import { ParsedQuery } from 'query';
import { AdvancedQuery } from 'query/advanced-query';
import { Roles } from './decorators';
import { InviteUserRequest, LoggedUserDto } from './dto';
import { RolesGuard } from './guards';
import { User, UserRoles } from './model';
import { UsersService } from './users.service';

const USER_ID = 'id';

@Crud({
  model: {
    type: User,
  },
  routes: {
    exclude: ['createManyBase', 'getManyBase'],
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
@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRoles.Admin, UserRoles.UserManager, UserRoles.User)
export class UsersController implements CrudController<User> {
  constructor(readonly service: UsersService) { }

  get base(): CrudController<User> {
    return this;
  }

  @Roles(UserRoles.Admin, UserRoles.UserManager)
  @Override()
  async createOne(@ParsedRequest() req: CrudRequest, @ParsedBody() dto: User, @LoggedUser() loggedUser: LoggedUserDto)
    : Promise<Partial<User>> {

    this.checkPermission(loggedUser, dto);

    return this.service.createOne(req, dto);
  }

  @Override()
  async getOne(@ParsedRequest() req: CrudRequest, @LoggedUser() loggedUser: LoggedUserDto): Promise<void | User> {
    const resultUser = await this.base.getOneBase(req);

    this.checkPermission(loggedUser, resultUser);

    return resultUser;
  }

  @Override()
  async deleteOne(@ParsedRequest() req: CrudRequest, @LoggedUser() loggedUser: LoggedUserDto): Promise<void | User> {
    const existingUser = await this.service.getOne(req);

    this.checkPermission(loggedUser, existingUser);

    return this.service.deleteOne(req);
  }

  @Override()
  async replaceOne(@ParsedRequest() req: CrudRequest,
                   @ParsedBody() dto: User,
                   @LoggedUser() loggedUser: LoggedUserDto,
                   @Param(USER_ID, ParseIntPipe) paramId: number): Promise<Partial<User>> {
    await this.checkPermissionToUpdate(req, dto, loggedUser, paramId);

    return this.service.replaceOne(req, dto);
  }

  @Override()
  async updateOne(@ParsedRequest() req: CrudRequest,
                  @ParsedBody() dto: User,
                  @LoggedUser() loggedUser: LoggedUserDto,
                  @Param(USER_ID, ParseIntPipe) paramId: number): Promise<Partial<User>> {
    await this.checkPermissionToUpdate(req, dto, loggedUser, paramId);

    return this.service.updateOne(req, dto);
  }

  @Get()
  @Override('getManyBase')
  @UseInterceptors(CrudRequestInterceptor)
  @Roles(UserRoles.Admin, UserRoles.UserManager)
  @ApiOperation({ summary: 'Get many Users' })
  @ApiQuery({ name: 'query', type: 'string', required: false })
  @ApiQuery({ name: 'limit', type: 'number', required: false, schema: { minimum: 1 } })
  @ApiQuery({ name: 'page', type: 'number', required: false, schema: { minimum: 1 } })
  @ApiQuery({ name: 'sort', type: 'string', isArray: true, required: false })
  async getMany(@ParsedRequest() req: CrudRequest, @ParsedQuery() query: AdvancedQuery<User>): Promise<User[]> {
    return this.service.getUsers(req, query);
  }

  @Post('/invite')
  @Roles(UserRoles.Admin)
  @ApiBody({ type: InviteUserRequest })
  async invite(@Body() inviteRequest: InviteUserRequest) {
    this.service.invite(inviteRequest.email);
  }

  private async checkPermissionToUpdate(req: CrudRequest, dto: User, loggedUser: LoggedUserDto, paramId: number) {
    throwIfBodyOverridesPath(req, dto);

    this.checkPermission(loggedUser, dto);

    const existingUser = await this.service.findOne(paramId);

    if (existingUser) {
      this.checkPermission(loggedUser, existingUser);
    }
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
