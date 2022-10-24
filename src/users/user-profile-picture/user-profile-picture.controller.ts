import { Controller, Get, HttpStatus, Param, ParseIntPipe, Put, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiProduces, ApiResponse, ApiTags } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Upload User profile picture' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'User profile picture',
    type: ProfilePictureDto,
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Profile picture was updated.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'The user was not found.' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'The logged user cannot update the profile picture of this user.' })
  async uploadFile(@ParsedRequest() req: CrudRequest,
                   @UploadedFile() file: Buffer,
                   @LoggedUser() loggedUser: LoggedUserDto,
                   @Param(USER_ID, ParseIntPipe) userId: number) {
    const userToBeModified: User = await this.usersService.findOne({ where: { id: userId } });

    checkPermission(loggedUser, userToBeModified);

    const profilePicture: UserProfilePicture = { userId, picture: file.buffer };

    await this.service.replaceOne(req, profilePicture);
  }

  @Get(PROFILE_PICTURE_ROUTE)
  @ApiOperation({ summary: 'Retrieve User profile picture' })
  @ApiParam({ name: USER_ID })
  @ApiResponse({ status: HttpStatus.OK, type: ArrayBuffer })
  @ApiResponse({ status: HttpStatus.OK, type: SharedArrayBuffer })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'The user was not found.' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'There is no profile picture associated with the user.' })
  @ApiProduces('jpeg')
  @UseInterceptors(CrudRequestInterceptor)
  async getFile(@Res() res: Response, @Param(USER_ID, ParseIntPipe) userId: number) {
    const profilePicture = await this.service.findOne({ where: { userId }, relations: ['user'] });

    if (profilePicture && profilePicture.picture) {
      res.status(HttpStatus.OK).type('jpeg').send(profilePicture.picture);
    } else {
      res.status(HttpStatus.NO_CONTENT).end();
    }
  }
}
