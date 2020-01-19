import { Body, Controller, Get, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiBody, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Crud, CrudController, CrudRequest, CrudRequestInterceptor, ParsedRequest } from '@nestjsx/crud';
import { propertyOf } from 'common';
import { InviteUserRequest, Roles, RolesGuard, User, UserRoles, UsersService } from 'users';
import { AcceptInviteRequest } from './dto';
import { InviteService } from './invite.service';

@Crud({
  model: {
    type: User,
  },
  dto: {
    create: AcceptInviteRequest,
  },
  routes: {
    exclude: [
      'createManyBase',
      'createOneBase',
      'deleteOneBase',
      'getManyBase',
      'getOneBase',
      'replaceOneBase',
      'updateOneBase',
    ],
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
@Controller('invite')
@ApiTags('Invite')
@Roles(UserRoles.Admin, UserRoles.UserManager, UserRoles.User)
export class InviteController implements CrudController<User> {
  constructor(private readonly inviteService: InviteService,
              readonly service: UsersService) { }

  @Post('/send')
  @Roles(UserRoles.Admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @ApiBody({ type: InviteUserRequest })
  async invite(@Body() inviteRequest: InviteUserRequest) {
    return this.inviteService.invite(inviteRequest.email);
  }

  @Get('/validate')
  @ApiQuery({ name: 'token', description: 'JWT token issued to the invited user.' })
  async validate(@Query('token') token: string) {
    return this.inviteService.validateInviteToken(token);
  }

  @Post('/accept')
  @ApiBody({ type: AcceptInviteRequest })
  @UseInterceptors(CrudRequestInterceptor)
  async accept(@ParsedRequest() req: CrudRequest, @Body() acceptRequest: AcceptInviteRequest) {
    return this.inviteService.acceptInvite(acceptRequest, req);
  }
}
