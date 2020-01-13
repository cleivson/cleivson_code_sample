import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CrudRequest } from '@nestjsx/crud';
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

/**
 * Provides the services that will be exposed by the controllers of this module.
 */
@Injectable()
export class UsersService extends TypeOrmCrudService<User> {
  private readonly saltRounds = 10;

  constructor(@InjectRepository(User) repository: Repository<User>) {
    super(repository);
  }

  /**
   * Creates an account for a new user.
   * @param userDto The information that a new user must provide to create an account.
   * @throws DuplicateUserException if already exists an user with the same username.
   * @returns The created user.
   */
  async registerUser(userDto: CreateUserRequestDto): Promise<User> {
    // To avoid data injection
    const { password, username } = userDto;

    const userToInsert: User = Object.assign(new User(), { password, username });

    return this.createUser(userToInsert);
  }

  /**
   * Creates a new user.
   * @param user The user to be created.
   * @throws DuplicateUserException if already exists an user with the same username.
   * @throws BadRequestException if the id and/or the passwordHash properties of the user are set.
   * @returns The created user.
   */
  async createUser(user: User): Promise<User> {
    if (user.id) {
      this.throwBadRequestException('New user should not have an id.');
    }

    return this.saveUser(user);
  }

  /**
   * Updates an user.
   * @param user The user to be updated.
   * @throws DuplicateUserException if already exists a different user with the same username.
   * @throws NotFoundException if the user does not exist in the database.
   * @throws BadRequestException if the passwordHash property of the user is set.
   * @returns The updated user.
   */
  async updateUser(user: User): Promise<User> {
    const existingUser = await this.repo.findOne(user.id);

    if (!existingUser) {
      this.throwNotFoundException(this.repo.metadata.targetName);
    }

    return this.saveUser(user);
  }

  /**
   * Creates a new user if it does not exist or updates the user if it already exists in the database.
   * @param user The user to be created if it does not exist or updated otherwise.
   * @throws DuplicateUserException if already exists a different user with the same username.
   * @throws BadRequestException if the passwordHash property of the user is set.
   * @returns The saved user.
   */
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

  /**
   * Fetches the users from the database according to the given criteria.
   * @param req The CrudRequest that contains information like pagination, offset, sort key, ... about the query in the database.
   * @param query The query to filter the results to be returned.
   * @returns Array with the users in the database that meet the given criteria.
   */
  async getUsers(req: CrudRequest, query: AdvancedQuery<User>): Promise<User[]> {
    const { parsed, options } = req;

    const queryBuilder = await this.createBuilder(parsed, options);

    TypeormQueryBuilderVisitor.applyQuery(query, queryBuilder);

    const { raw, entities } = await queryBuilder.getRawAndEntities();

    return entities;
  }

  /**
   * Checks if a password meets a user encrypted password.
   * @param passwordToVerify The plain-text password to compare with the password of the user.
   * @param user The user against whom to check the password.
   * @returns True if the password matches the password of the user, false otherwise.
   */
  async verifyPassword(passwordToVerify: string, user: User): Promise<boolean> {
    return bcrypt.compare(passwordToVerify, user.passwordHash);
  }

  /**
   * Encrypts a password to be persisted in the database.
   * @param password The plain-text password to be encrypted.
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hashSync(password, saltRounds);
  }

  private translateError(e: any, userDto: CreateUserRequestDto) {
    if (e.name === 'QueryFailedError') {
      if (e.code === 'ER_DUP_ENTRY') {
        throw new DuplicateUserException(userDto.username);
      } else {
        throw new BadRequestException(e.message);
      }
    }
    throw e;
  }
}
