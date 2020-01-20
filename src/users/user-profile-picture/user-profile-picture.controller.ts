import { Controller, Get, HttpStatus, Param, ParseIntPipe, Res, UploadedFile, UseGuards, UseInterceptors, Put } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiParam, ApiTags } from '@nestjs/swagger';
import { Crud, CrudController, CrudRequest, CrudRequestInterceptor, ParsedRequest } from '@nestjsx/crud';
import { LoggedUser } from 'auth';
import { Response } from 'express';
import { checkPermission, LoggedUserDto, ProfilePictureDto, RolesGuard, User, UsersService } from 'users';
import { UserProfilePicture } from './model';
import { UserProfilePictureService } from './user-profile-picture.service';

const USER_ID = 'userId';
const PROFILE_PICTURE_ROUTE = `:${USER_ID}/profile-picture`;

@Crud({
  model: {
    type: UserProfilePicture,
  },
  params: {
    userId: {
      primary: true,
      field: USER_ID,
      type: 'number',
    },
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
  validation: {
    transform: true,
  },
})
@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiTags('Users')
@ApiBearerAuth()
export class UserProfilePictureController implements CrudController<UserProfilePicture> {
  constructor(readonly service: UserProfilePictureService,
              private readonly usersService: UsersService) { }

  @Put(PROFILE_PICTURE_ROUTE)
  @UseInterceptors(FileInterceptor('picture'), CrudRequestInterceptor)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'User profile picture',
    type: ProfilePictureDto,
  })
  async uploadFile(@ParsedRequest() req: CrudRequest,
                   @UploadedFile() file: Buffer,
                   @LoggedUser() loggedUser: LoggedUserDto,
                   @Param(USER_ID, ParseIntPipe) userId: number) {
    const userToBeModified: User = await this.usersService.findOne(userId);

    checkPermission(loggedUser, userToBeModified);

    const profilePicture: UserProfilePicture = { userId, picture: file.buffer };

    await this.service.replaceOne(req, profilePicture);
  }

  @Get(PROFILE_PICTURE_ROUTE)
  @ApiParam({ name: USER_ID })
  @UseInterceptors(CrudRequestInterceptor)
  async getFile(@Res() res: Response, @Param(USER_ID, ParseIntPipe) userId: number) {
    const profilePicture = await this.service.findOne({ userId }, { relations: ['user'] });

    // TODO Test
    if (profilePicture && profilePicture.picture) {
      res.status(HttpStatus.OK).type('jpeg').send(profilePicture.picture);
    } else {
      res.status(HttpStatus.NO_CONTENT).end();
    }
  }
}
