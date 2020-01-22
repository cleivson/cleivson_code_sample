import { Controller, Get, HttpStatus, Param, ParseIntPipe, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Crud, CrudController, CrudRequest, CrudRequestInterceptor, Override, ParsedBody, ParsedRequest } from '@nestjsx/crud';
import { LoggedUser } from 'auth/decorators/logged-user.decorator';
import { ParsedQuery } from 'query';
import { AdvancedQuery } from 'query/advanced-query';
import { checkPermission, checkPermissionToUpdate, userFieldsToExcludeFromResponse } from './controller-permissions-checker';
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
    exclude: userFieldsToExcludeFromResponse,
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
  @ApiResponse({ status: HttpStatus.CREATED, type: User })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Logged user cannot create new users.' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'The e-mail is already registered.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'The information about the user is invalid.' })
  async createOne(@ParsedRequest() req: CrudRequest, @ParsedBody() dto: User, @LoggedUser() loggedUser: LoggedUserDto)
    : Promise<Partial<User>> {

    checkPermission(loggedUser, dto);

    return this.service.createOne(req, dto);
  }

  @Override()
  @ApiResponse({ status: HttpStatus.OK, type: User })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Logged user cannot retrieve the specified user.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'No user with the specified id was found.' })
  async getOne(@ParsedRequest() req: CrudRequest, @LoggedUser() loggedUser: LoggedUserDto): Promise<User> {
    const resultUser = await this.base.getOneBase(req);

    checkPermission(loggedUser, resultUser);

    return resultUser;
  }

  @Override()
  @ApiResponse({ status: HttpStatus.OK, description: 'The user was deleted.' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Logged user cannot delete the specified user.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'No user with the specified id was found.' })
  async deleteOne(@ParsedRequest() req: CrudRequest, @LoggedUser() loggedUser: LoggedUserDto): Promise<void | User> {
    const existingUser = await this.service.getOne(req);

    checkPermission(loggedUser, existingUser);

    return this.service.deleteOne(req);
  }

  @Override()
  @ApiResponse({ status: HttpStatus.OK, type: User })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Logged user cannot update the specified user.' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Logged user is trying to lock/unlock himself.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'No user with the specified id was found.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'The information about the user is invalid.' })
  async replaceOne(@ParsedRequest() req: CrudRequest,
                   @ParsedBody() dto: User,
                   @LoggedUser() loggedUser: LoggedUserDto,
                   @Param(USER_ID, ParseIntPipe) paramId: number): Promise<Partial<User>> {
    await checkPermissionToUpdate(req, dto, loggedUser, paramId, this.service);

    return this.service.replaceOne(req, dto);
  }

  @Override()
  @ApiResponse({ status: HttpStatus.OK, type: User })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Logged user cannot update the specified user.' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Logged user is trying to lock/unlock himself.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'No user with the specified id was found.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'The information about the user is invalid.' })
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
  @ApiResponse({ type: User, isArray: true, status: HttpStatus.OK })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid query filter.' })
  async getMany(@ParsedRequest() req: CrudRequest, @ParsedQuery() query: AdvancedQuery<User>): Promise<User[]> {
    return this.service.getUsers(req, query);
  }
}
