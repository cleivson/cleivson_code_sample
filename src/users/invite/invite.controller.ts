import { Body, Controller, Get, HttpStatus, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Crud, CrudController, CrudRequest, CrudRequestInterceptor, ParsedRequest } from '@nestjsx/crud';
import { InviteUserRequest, Roles, RolesGuard, User, userFieldsToExcludeFromResponse, UserRoles, UsersService } from 'users';
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
    exclude: userFieldsToExcludeFromResponse,
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
  @ApiOperation({ summary: 'Send invite to User' })
  @ApiBearerAuth()
  @ApiBody({ type: InviteUserRequest })
  @ApiResponse({ status: HttpStatus.OK, description: 'The invitation e-mail was sent.' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'The invited e-mail is already registered.' })
  async invite(@Body() inviteRequest: InviteUserRequest) {
    return this.inviteService.invite(inviteRequest.email);
  }

  @Get('/validate')
  @ApiOperation({ summary: 'Validate invitation token' })
  @ApiQuery({ name: 'token', description: 'JWT token issued to the invited user.' })
  @ApiResponse({ status: HttpStatus.OK, description: 'The invite token is valid and can be used to register a new user.' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'The invited e-mail is already registered.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'The token is invalid or expired.' })
  async validate(@Query('token') token: string) {
    return this.inviteService.validateInviteToken(token);
  }

  @Post('/accept')
  @ApiOperation({ summary: 'Register a new User using an invitation token' })
  @ApiBody({ type: AcceptInviteRequest })
  @ApiResponse({ status: HttpStatus.CREATED, type: User })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'The invited e-mail is already registered.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'The token is invalid or expired.' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'The information about the user is invalid.' })
  @UseInterceptors(CrudRequestInterceptor)
  async accept(@ParsedRequest() req: CrudRequest, @Body() acceptRequest: AcceptInviteRequest) {
    return this.inviteService.acceptInvite(acceptRequest, req);
  }
}
