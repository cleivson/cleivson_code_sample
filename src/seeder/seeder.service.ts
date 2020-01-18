import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { User, UserRoles } from 'users';

@Injectable()
export class SeederService {
  private adminUserName = 'cleivson.tb+admin@gmail.com';
  private managerUserName = 'cleivson.tb+usermanager@gmail.com';
  private regularUserName = 'cleivson.tb+user@gmail.com';
  private defaultPassword = 'changeme';
  private defaultPasswordHashed = '$2b$10$uJpp54f03ez/anaE4LQA/uL0O2h73Z3RH65HLDQvwicgkJ9xZoK4W';

  constructor(@InjectRepository(User) private readonly usersRepository: Repository<User>,
              private readonly logger: Logger) { }

  getAdminUserCredentials(): Partial<User> {
    return { email: this.adminUserName, password: this.defaultPassword };
  }

  getManagerUserCredentials(): Partial<User> {
    return { email: this.managerUserName, password: this.defaultPassword };
  }

  getRegularUserCredentials(): Partial<User> {
    return { email: this.regularUserName, password: this.defaultPassword };
  }

  async seed() {
    const defaultUsers: Array<DeepPartial<User>> = [{
      email: this.adminUserName,
      passwordHash: this.defaultPasswordHashed,
      role: UserRoles.Admin,
      firstName: 'Admin',
      lastName: 'Cleivson',
      verified: true,
      id: 1,
    },
    {
      email: this.managerUserName,
      passwordHash: this.defaultPasswordHashed,
      role: UserRoles.UserManager,
      firstName: 'UserManager',
      lastName: 'Cleivson',
      verified: true,
      id: 2,
    },
    {
      email: this.regularUserName,
      passwordHash: this.defaultPasswordHashed,
      firstName: 'User',
      lastName: 'Cleivson',
      verified: true,
      id: 3,
    }];

    await Promise.all(defaultUsers.map(async user => {
      await this.usersRepository.save(user)
        .then(_ => this.logger.log(`User ${user.email} inserted.`))
        .catch(reason => this.logger.error(reason));
    }));
  }
}
