import { ClassSerializerInterceptor, Controller, Get, Patch, Post, Put, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Crud, CrudRequest, CrudRequestInterceptor, Override, ParsedBody, ParsedRequest } from '@nestjsx/crud';
import { throwIfBodyOverridesPath } from 'common';
import { AdvancedQuery, ParsedQuery } from 'query';
import { Roles, RolesGuard, UserRoles } from 'users';
import { JoggingService } from './jogging.service';
import { JoggingEntry } from './model';

@Crud({
    model: {
        type: JoggingEntry,
    },
    routes: {
        exclude: ['createManyBase', 'getManyBase'],
        deleteOneBase: {
            returnDeleted: true,
        },
    },
})
@UseInterceptors(ClassSerializerInterceptor)
@Controller('jogging')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiTags('Jogging Entries')
@Roles(UserRoles.Admin)
export class JoggingController {
    constructor(private readonly service: JoggingService) { }

    @Post()
    @Override('createOneBase')
    async createOne(@ParsedRequest() req: CrudRequest, @ParsedBody() joggingEntry: JoggingEntry): Promise<JoggingEntry> {
        throwIfBodyOverridesPath(req, joggingEntry);

        return this.service.createJoggingEntry(joggingEntry);
    }

    @Patch()
    @Override('updateOneBase')
    async updateOne(@ParsedRequest() req: CrudRequest, @ParsedBody() joggingEntry: JoggingEntry): Promise<JoggingEntry> {
        throwIfBodyOverridesPath(req, joggingEntry);

        return this.service.updateJoggingEntry(joggingEntry);
    }

    @Put()
    @Override('replaceOneBase')
    async replaceOne(@ParsedRequest() req: CrudRequest, @ParsedBody() joggingEntry: JoggingEntry): Promise<JoggingEntry> {
        throwIfBodyOverridesPath(req, joggingEntry);

        return this.service.saveJoggingEntry(joggingEntry);
    }

    @Get()
    @ApiOperation({ summary: 'Get many Jogging Entries' })
    @ApiQuery({ name: 'query', type: 'string', required: false })
    @ApiQuery({ name: 'limit', type: 'number', required: false, schema: { minimum: 1 } })
    @ApiQuery({ name: 'page', type: 'number', required: false, schema: { minimum: 1 } })
    @ApiQuery({ name: 'sort', type: 'string', isArray: true, required: false })
    @Override('getManyBase')
    @UseInterceptors(CrudRequestInterceptor)
    async getMany(@ParsedRequest() req: CrudRequest, @ParsedQuery() query: AdvancedQuery<JoggingEntry>): Promise<JoggingEntry[]> {
        return this.service.getJoggingEntries(req, query);
    }
}
