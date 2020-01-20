import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { Repository } from 'typeorm';
import { UserProfilePicture } from './model';

@Injectable()
export class UserProfilePictureService extends TypeOrmCrudService<UserProfilePicture> {
  constructor(@InjectRepository(UserProfilePicture) repository: Repository<UserProfilePicture>) {
    super(repository);
  }
}
