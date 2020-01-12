import { ClassSerializerInterceptor, Controller, Get, Param, ParseIntPipe, Patch, Post, Put, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Crud, CrudRequest, CrudRequestInterceptor, GetManyDefaultResponse, Override, ParsedBody, ParsedRequest } from '@nestjsx/crud';
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
    @UseInterceptors(CrudRequestInterceptor)
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
    @UseInterceptors(CrudRequestInterceptor)
    @Override('replaceOneBase')
    async replaceOne(@ParsedRequest() req: CrudRequest, @ParsedBody() joggingEntry: JoggingEntry): Promise<JoggingEntry> {
        throwIfBodyOverridesPath(req, joggingEntry);

        return this.service.saveJoggingEntry(joggingEntry);
    }

    @Override()
    async deleteOne(@ParsedRequest() req, @Param('id', ParseIntPipe) idToDelete) {
        return this.service.deleteJoggingEntry(idToDelete);
    }

    @Get()
    @ApiOperation({ summary: 'Get many Jogging Entries' })
    @ApiQuery({ name: 'query', type: 'string', required: false })
    @UseInterceptors(CrudRequestInterceptor)
    @Override('getManyBase')
    async getMany(@ParsedRequest() req: CrudRequest, @ParsedQuery() query: AdvancedQuery<JoggingEntry>)
        : Promise<GetManyDefaultResponse<JoggingEntry> | JoggingEntry[]> {
        return this.service.getJoggingEntries(req, query);
    }
}
