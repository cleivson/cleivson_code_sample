import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { User, UserRoles } from 'users';

@Injectable()
export class SeederService {
  private adminUserName = 'admin';
  private managerUserName = 'usermanager';
  private regularUserName = 'user';
  private defaultPassword = 'changeme';
  private defaultPasswordHashed = '$2b$10$uJpp54f03ez/anaE4LQA/uL0O2h73Z3RH65HLDQvwicgkJ9xZoK4W';

  constructor(@InjectRepository(User) private readonly usersRepository: Repository<User>,
              private readonly logger: Logger) { }

  getAdminUserCredentials(): Partial<User> {
    return { username: this.adminUserName, password: this.defaultPassword };
  }

  getManagerUserCredentials(): Partial<User> {
    return { username: this.managerUserName, password: this.defaultPassword };
  }

  getRegularUserCredentials(): Partial<User> {
    return { username: this.regularUserName, password: this.defaultPassword };
  }

  async seed() {
    const defaultUsers: Array<DeepPartial<User>> = [{
      username: this.adminUserName,
      passwordHash: this.defaultPasswordHashed,
      role: UserRoles.Admin,
      id: 1,
    },
    {
      username: this.managerUserName,
      passwordHash: this.defaultPasswordHashed,
      role: UserRoles.UserManager,
      id: 2,
    },
    {
      username: this.regularUserName,
      passwordHash: this.defaultPasswordHashed,
      id: 3,
    }];

    await Promise.all(defaultUsers.map(async user => {
      await this.usersRepository.save(user)
        .then(_ => this.logger.log(`User ${user.username} inserted.`))
        .catch(reason => this.logger.error(reason));
    }));
  }
}
