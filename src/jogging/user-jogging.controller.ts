import { ClassSerializerInterceptor, Controller, Delete, ForbiddenException, Get, Param, ParseIntPipe, Patch, Post, Put, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Crud, CrudRequest, CrudRequestInterceptor, GetManyDefaultResponse, Override, ParsedBody, ParsedRequest } from '@nestjsx/crud';
import { LoggedUser } from 'auth';
import { AdvancedQuery, ParsedQuery } from 'query';
import { LoggedUserDto, Roles, RolesGuard, UserRoles } from 'users';
import { throwIfBodyOverridesPath } from '../common/controller.functions';
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
})
@UseInterceptors(ClassSerializerInterceptor)
@Controller('users/:userId/jogging-entries')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiTags('User jogging entries')
@Roles(UserRoles.User, UserRoles.Admin)
export class UserJoggingController {
    constructor(private readonly service: JoggingService) { }

    @Post()
    @Override('createOneBase')
    async createOne(@ParsedRequest() req: CrudRequest,
                    @ParsedBody() joggingEntry: JoggingEntry,
                    @Param(USER_ID, ParseIntPipe) pathUserId: number,
                    @LoggedUser() user: LoggedUserDto): Promise<JoggingEntry> {

        throwIfBodyOverridesPath(req, joggingEntry);

        this.validateJoggingEntryOwner(user, pathUserId);

        return this.service.createJoggingEntry(joggingEntry);
    }

    @Patch()
    @UseInterceptors(CrudRequestInterceptor)
    @Override('updateOneBase')
    async updateOne(@ParsedRequest() req: CrudRequest,
                    @ParsedBody() joggingEntry: JoggingEntry,
                    @Param(USER_ID, ParseIntPipe) pathUserId: number,
                    @LoggedUser() user: LoggedUserDto): Promise<JoggingEntry> {

        throwIfBodyOverridesPath(req, joggingEntry);

        this.validateJoggingEntryOwner(user, pathUserId);

        return this.service.updateJoggingEntry(joggingEntry);
    }

    @Put()
    @UseInterceptors(CrudRequestInterceptor)
    @Override('replaceOneBase')
    async replaceOne(@ParsedRequest() req: CrudRequest,
                     @ParsedBody() joggingEntry: JoggingEntry,
                     @Param(USER_ID, ParseIntPipe) pathUserId: number,
                     @LoggedUser() user: LoggedUserDto): Promise<JoggingEntry> {

        throwIfBodyOverridesPath(req, joggingEntry);

        this.validateJoggingEntryOwner(user, pathUserId);

        return this.service.saveJoggingEntry(joggingEntry);
    }

    @Delete()
    @UseInterceptors(CrudRequestInterceptor)
    @Override('deleteOneBase')
    async deleteOne(@ParsedRequest() req: CrudRequest,
                    @Param(USER_ID, ParseIntPipe) pathUserId: number,
                    @LoggedUser() user: LoggedUserDto) {
        this.validateJoggingEntryOwner(user, pathUserId);

        return this.service.deleteOne(req);
    }

    @Get()
    @ApiOperation({ summary: 'Get many jogging entries related to a specific user' })
    @ApiQuery({ name: 'query', type: 'string', required: false })
    @UseInterceptors(CrudRequestInterceptor)
    @Override('getManyBase')
    async getUserJoggingEntries(@ParsedRequest() req: CrudRequest,
                                @ParsedQuery() query: AdvancedQuery<JoggingEntry>,
                                @Param(USER_ID, ParseIntPipe) pathUserId: number,
                                @LoggedUser() user: LoggedUserDto): Promise<GetManyDefaultResponse<JoggingEntry> | JoggingEntry[]> {

        this.validateJoggingEntryOwner(user, pathUserId);

        return this.service.getJoggingEntries(req, query, pathUserId);
    }

    private validateJoggingEntryOwner(user: LoggedUserDto, pathUserId: number) {
        if (user.role !== UserRoles.Admin && user.id !== pathUserId) {
            throw new ForbiddenException('User does not have access to jogging entries of another user.');
        }
    }
}
