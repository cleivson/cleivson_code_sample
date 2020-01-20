import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from 'users';
import { UserProfilePicture } from './model';
import { UserProfilePictureController } from './user-profile-picture.controller';
import { UserProfilePictureService } from './user-profile-picture.service';

@Module({
  imports: [UserModule, TypeOrmModule.forFeature([UserProfilePicture])],
  providers: [UserProfilePictureService],
  controllers: [UserProfilePictureController],
})
export class UserProfilePictureModule {}
