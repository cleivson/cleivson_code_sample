import { ClassSerializerInterceptor, Controller, Delete, ForbiddenException, Get, HttpStatus, Param, ParseIntPipe, Patch, Post, Put, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Crud, CrudRequest, CrudRequestInterceptor, GetManyDefaultResponse, Override, ParsedBody, ParsedRequest } from '@nestjsx/crud';
import { LoggedUser } from 'auth';
import { AdvancedQuery, ParsedQuery } from 'query';
import { LoggedUserDto, Roles, RolesGuard, UserRoles } from 'users';
import { throwIfBodyOverridesPath } from '../common/controller.functions';
import { WeeklyReportDto } from './dto/weekly-report.dto';
import { JoggingService } from './jogging.service';
import { JoggingEntry } from './model';

const USER_ID = 'userId';

@Crud({
  model: {
    type: JoggingEntry,
  },
  routes: {
    exclude: ['createManyBase', 'getManyBase'],
  },
  params: {
    userId: {
      field: USER_ID,
      type: 'number',
    },
  },
  validation: {
    transform: true,
  },
})
@UseInterceptors(ClassSerializerInterceptor)
@Controller('users/:userId/jogging-entries')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiTags('User jogging entries')
@Roles(UserRoles.User, UserRoles.Admin)
export class UserJoggingController {
  constructor(private readonly service: JoggingService) { }

  @Get()
  @Override()
  @ApiResponse({ status: HttpStatus.OK, type: JoggingEntry })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Logged user cannot retrieve jogging entries of specified user.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found or entry not found.' })
  async getOne(@ParsedRequest() req: CrudRequest,
               @Param(USER_ID, ParseIntPipe) pathUserId: number,
               @LoggedUser() user: LoggedUserDto): Promise<JoggingEntry> {
    this.validateJoggingEntryOwner(user, pathUserId);

    return this.service.getOne(req);
  }

  @Post()
  @Override()
  @ApiResponse({ status: HttpStatus.CREATED, type: JoggingEntry })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Logged user cannot retrieve jogging entries of specified user.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'The information about the entry is invalid.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found.' })
  async createOne(@ParsedRequest() req: CrudRequest,
                  @ParsedBody() joggingEntry: JoggingEntry,
                  @Param(USER_ID, ParseIntPipe) pathUserId: number,
                  @LoggedUser() user: LoggedUserDto): Promise<JoggingEntry> {

    throwIfBodyOverridesPath(req, joggingEntry);

    this.validateJoggingEntryOwner(user, pathUserId);

    return this.service.createJoggingEntry(joggingEntry);
  }

  @Patch()
  @Override()
  @ApiResponse({ status: HttpStatus.CREATED, type: JoggingEntry })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Logged user cannot update jogging entries of specified user.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'The information about the entry is invalid.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found or entry not found.' })
  async updateOne(@ParsedRequest() req: CrudRequest,
                  @ParsedBody() joggingEntry: JoggingEntry,
                  @Param(USER_ID, ParseIntPipe) pathUserId: number,
                  @LoggedUser() user: LoggedUserDto): Promise<JoggingEntry> {

    throwIfBodyOverridesPath(req, joggingEntry);

    this.validateJoggingEntryOwner(user, pathUserId);

    return this.service.updateJoggingEntry(joggingEntry);
  }

  @Put()
  @Override()
  @ApiResponse({ status: HttpStatus.CREATED, type: JoggingEntry })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Logged user cannot update jogging entries of specified user.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'The information about the entry is invalid.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found or entry not found.' })
  async replaceOne(@ParsedRequest() req: CrudRequest,
                   @ParsedBody() joggingEntry: JoggingEntry,
                   @Param(USER_ID, ParseIntPipe) pathUserId: number,
                   @LoggedUser() user: LoggedUserDto): Promise<JoggingEntry> {

    throwIfBodyOverridesPath(req, joggingEntry);

    this.validateJoggingEntryOwner(user, pathUserId);

    return this.service.saveJoggingEntry(joggingEntry);
  }

  @Delete()
  @Override()
  @ApiResponse({ status: HttpStatus.OK, description: 'The entry was deleted.' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Logged user cannot delete jogging entries of specified user.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found or entry not found.' })
  async deleteOne(@ParsedRequest() req: CrudRequest,
                  @Param(USER_ID, ParseIntPipe) pathUserId: number,
                  @LoggedUser() user: LoggedUserDto) {
    this.validateJoggingEntryOwner(user, pathUserId);

    return this.service.deleteOne(req);
  }

  @Get()
  @Override('getManyBase')
  @UseInterceptors(CrudRequestInterceptor)
  @ApiOperation({ summary: 'Get many jogging entries related to a specific user' })
  @ApiQuery({ name: 'query', type: 'string', required: false })
  @ApiQuery({ name: 'limit', type: 'number', required: false, schema: { minimum: 1 } })
  @ApiQuery({ name: 'page', type: 'number', required: false, schema: { minimum: 1 } })
  @ApiQuery({ name: 'sort', type: 'string', isArray: true, required: false })
  @ApiResponse({ type: JoggingEntry, isArray: true, status: HttpStatus.OK })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid query filter.' })
  async getUserJoggingEntries(@ParsedRequest() req: CrudRequest,
                              @ParsedQuery() query: AdvancedQuery<JoggingEntry>,
                              @Param(USER_ID, ParseIntPipe) pathUserId: number,
                              @LoggedUser() user: LoggedUserDto): Promise<JoggingEntry[]> {

    this.validateJoggingEntryOwner(user, pathUserId);

    return this.service.getJoggingEntries(req, query, pathUserId);
  }

  @Get('/weekly-report')
  @ApiOperation({ summary: 'Generate jogging weekly report for a specific user' })
  @ApiResponse({ status: HttpStatus.OK, type: WeeklyReportDto, isArray: true })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Logged user cannot generate report of jogging entries for specified user.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User not found.' })
  async generateWeeklyReport(@Param(USER_ID, ParseIntPipe) pathUserId: number,
                             @LoggedUser() user: LoggedUserDto): Promise<GetManyDefaultResponse<WeeklyReportDto> | WeeklyReportDto[]> {

    this.validateJoggingEntryOwner(user, pathUserId);

    return this.service.generateWeeklyReport(pathUserId);
  }

  private validateJoggingEntryOwner(user: LoggedUserDto, pathUserId: number) {
    if (user.role !== UserRoles.Admin && user.id !== pathUserId) {
      throw new ForbiddenException('User does not have access to jogging entries of another user.');
    }
  }
}
