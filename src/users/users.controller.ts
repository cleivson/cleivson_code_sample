import { Controller, Get, Param, ParseIntPipe, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Crud, CrudController, CrudRequest, CrudRequestInterceptor, Override, ParsedBody, ParsedRequest } from '@nestjsx/crud';
import { LoggedUser } from 'auth/decorators/logged-user.decorator';
import { propertyOf } from 'common';
import { ParsedQuery } from 'query';
import { AdvancedQuery } from 'query/advanced-query';
import { checkPermission, checkPermissionToUpdate } from './controller-permissions-checker';
import { Roles } from './decorators';
import { LoggedUserDto } from './dto';
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
      propertyOf<User>('picture'),
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

    checkPermission(loggedUser, dto);

    return this.service.createOne(req, dto);
  }

  @Override()
  async getOne(@ParsedRequest() req: CrudRequest, @LoggedUser() loggedUser: LoggedUserDto): Promise<void | User> {
    const resultUser = await this.base.getOneBase(req);

    checkPermission(loggedUser, resultUser);

    return resultUser;
  }

  @Override()
  async deleteOne(@ParsedRequest() req: CrudRequest, @LoggedUser() loggedUser: LoggedUserDto): Promise<void | User> {
    const existingUser = await this.service.getOne(req);

    checkPermission(loggedUser, existingUser);

    return this.service.deleteOne(req);
  }

  @Override()
  async replaceOne(@ParsedRequest() req: CrudRequest,
                   @ParsedBody() dto: User,
                   @LoggedUser() loggedUser: LoggedUserDto,
                   @Param(USER_ID, ParseIntPipe) paramId: number): Promise<Partial<User>> {
    await checkPermissionToUpdate(req, dto, loggedUser, paramId, this.service);

    return this.service.replaceOne(req, dto);
  }

  @Override()
  async updateOne(@ParsedRequest() req: CrudRequest,
                  @ParsedBody() dto: User,
                  @LoggedUser() loggedUser: LoggedUserDto,
                  @Param(USER_ID, ParseIntPipe) paramId: number): Promise<Partial<User>> {
    await checkPermissionToUpdate(req, dto, loggedUser, paramId, this.service);

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
}
