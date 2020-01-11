import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CrudRequest, GetManyDefaultResponse } from '@nestjsx/crud';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import * as bcrypt from 'bcrypt';
import { AdvancedQuery, TypeormQueryBuilderVisitor } from 'query';
import { Repository } from 'typeorm';
import { CreateUserRequestDto } from './dto';
import { DuplicateUserException } from './exceptions/duplicate-user.exception';
import { User } from './model';

/**
 * Number of salt rounds to be used when hashing the password.
 */
const saltRounds: number = 10;
const DEFAULT_DAILY_CALORIES = 1500;

@Injectable()
export class UsersService extends TypeOrmCrudService<User> {
  private readonly saltRounds = 10;

  constructor(@InjectRepository(User) repository: Repository<User>) {
    super(repository);
  }

  async registerUser(userDto: CreateUserRequestDto): Promise<User> {
    // To avoid data injection
    const { password, username } = userDto;

    const userToInsert: User = Object.assign(new User(), { password, username });

    return this.createUser(userToInsert);
  }

  async createUser(user: User) {
    if (user.id) {
      this.throwBadRequestException('New user should not have an id.');
    }

    return this.saveUser(user);
  }

  async updateUser(user: User): Promise<User> {
    const existingUser = await this.repo.findOne(user.id);

    if (!existingUser) {
      this.throwNotFoundException(this.repo.metadata.targetName);
    }

    return this.saveUser(user);
  }

  async saveUser(user: User): Promise<User> {
    if (user.passwordHash) {
      this.throwBadRequestException('Password hash should not be set.');
    }

    if (user.password) {
      user.passwordHash = await this.hashPassword(user.password);
    }

    try {
      return await this.repo.save(user);
    } catch (e) {
      this.translateError(e, user);
    }
  }

  async deleteUser(userId: number) {
    return this.repo.manager.transaction(async transactionManager => {
      // TODO remove jogging entries
      await transactionManager.delete(User, { id: userId });
    });
  }

  async getUsers(req: CrudRequest, query: AdvancedQuery<User>)
    : Promise<GetManyDefaultResponse<User> | User[] | PromiseLike<GetManyDefaultResponse<User> | User[]>> {
    const { parsed, options } = req;

    const queryBuilder = await this.createBuilder(parsed, options);

    TypeormQueryBuilderVisitor.applyQuery(query, queryBuilder);

    const { raw, entities } = await queryBuilder.getRawAndEntities();

    return entities;
  }

  async verifyPassword(passwordToVerify: string, user: User): Promise<boolean> {
    return bcrypt.compare(passwordToVerify, user.passwordHash);
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hashSync(password, saltRounds);
  }

  private translateError(e: any, userDto: CreateUserRequestDto) {
    if (e.name === 'QueryFailedError') {
      if (e.code === 'ER_DUP_ENTRY') {
        throw new DuplicateUserException(userDto.username);
      } else {
        throw new BadRequestException();
      }
    }
    throw e;
  }
}
