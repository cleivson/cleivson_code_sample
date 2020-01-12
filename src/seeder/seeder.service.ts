import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { CreateUserRequestDto, User, UserRoles } from 'users';

@Injectable()
export class SeederService {
  private adminUserName = 'admin';
  private managerUserName = 'usermanager';
  private regularUserName = 'user';
  private defaultPassword = 'changeme';
  private defaultPasswordHashed = '$2b$10$uJpp54f03ez/anaE4LQA/uL0O2h73Z3RH65HLDQvwicgkJ9xZoK4W';

  constructor(@InjectRepository(User) private readonly usersRepository: Repository<User>,
              private readonly logger: Logger) { }

  getAdminUserCredentials(): CreateUserRequestDto {
    return { username: this.adminUserName, password: this.defaultPassword };
  }

  getManagerUserCredentials(): CreateUserRequestDto {
    return { username: this.managerUserName, password: this.defaultPassword };
  }

  getRegularUserCredentials(): CreateUserRequestDto {
    return { username: this.regularUserName, password: this.defaultPassword };
  }

  async seed() {
    const defaultUsers: Array<DeepPartial<User>> = [{
      username: this.adminUserName,
      passwordHash: this.defaultPasswordHashed,
      role: UserRoles.Admin,
    },
    {
      username: this.managerUserName,
      passwordHash: this.defaultPasswordHashed,
      role: UserRoles.UserManager,
    },
    {
      username: this.regularUserName,
      passwordHash: this.defaultPasswordHashed,
    }];

    await Promise.all(defaultUsers.map(async user => {
      await this.usersRepository.insert(user)
        .then(_ => this.logger.log(`User ${user.username} inserted.`))
        .catch(reason => this.logger.error(reason));
    }));
  }
}
