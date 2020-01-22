import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CrudRequest } from '@nestjsx/crud';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import * as bcrypt from 'bcrypt';
import { AdvancedQuery, TypeormQueryBuilderVisitor } from 'query';
import { DeepPartial, QueryFailedError, Repository } from 'typeorm';
import { DuplicateUserException } from './exceptions/duplicate-user.exception';
import { User } from './model';
import { VerificationService } from './verification.service';

/**
 * Number of salt rounds to be used when hashing the password.
 */
const saltRounds: number = 10;

/**
 * Provides the services that will be exposed by the controllers of this module.
 */
@Injectable()
export class UsersService extends TypeOrmCrudService<User> {
  constructor(@InjectRepository(User) repository: Repository<User>,
              private readonly verificationService: VerificationService) {
    super(repository);
  }

  /**
   * Checks if a verification token is valid based on its key.
   * @param token The token key to find the verification token.
   * @param userEmail The email of the user being validated.
   * @throws NotFoundException when the token was not found related to the user.
   * @throws VerificationTokenExpiredException when the token already expired.
   * @throws UserAlreadyVerifiedException when the user associated to the token was already verified.
   */
  async validateEmail(token: string, userEmail: string) {
    await this.verificationService.validateToken(token, userEmail);
  }

  /**
   * Creates a new user.
   * @param userToInsert The user to be created.
   * @throws DuplicateUserException if already exists an user with the same username.
   * @throws BadRequestException if the id and/or the passwordHash properties of the user are set.
   * @returns The created user.
   */
  async createOne(req: CrudRequest, userToInsert: DeepPartial<User>): Promise<User> {
    await this.checkExistingUserId(userToInsert);

    try {
      const savedUser = await super.createOne(req, userToInsert);

      if (!userToInsert.verified) {
        await this.verificationService.generateValidationToken(savedUser);
      }

      return savedUser;
    } catch (e) {
      this.translateError(e, userToInsert);
    }
  }

  /**
   * Updates an user.
   * @param user The user to be updated.
   * @throws DuplicateUserException if already exists a different user with the same username.
   * @throws NotFoundException if the user does not exist in the database.
   * @throws BadRequestException if the passwordHash property of the user is set.
   * @returns The updated user.
   */
  async updateOne(req: CrudRequest, dto: DeepPartial<User>): Promise<User> {
    const oldEmail = await this.getCurrentEmail(dto);

    try {
      const savedUser = await super.updateOne(req, dto);

      await this.checkEmailChanged(savedUser, oldEmail);

      return savedUser;
    } catch (e) {
      this.translateError(e, dto);
    }
  }

  /**
   * Creates a new user if it does not exist or updates the user if it already exists in the database.
   * @param user The user to be created if it does not exist or updated otherwise.
   * @throws DuplicateUserException if already exists a different user with the same username.
   * @throws BadRequestException if the passwordHash property of the user is set.
   * @returns The saved user.
   */
  async replaceOne(req: CrudRequest, dto: DeepPartial<User>): Promise<User> {
    const oldEmail = await this.getCurrentEmail(dto);

    try {
      const savedUser = await super.replaceOne(req, dto);

      this.checkEmailChanged(savedUser, oldEmail);

      return savedUser;
    } catch (e) {
      this.translateError(e, dto);
    }
  }

  /**
   * Saves an user directly to the database.
   *
   * DO NOT use this method to save plain text passwords or any other field that demands precomputing.
   * @param user The user to be saved.
   */
  async save(user: User): Promise<User> {
    try {
      this.updateHashedPassword(user);

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

    const { entities } = await queryBuilder.getRawAndEntities();

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
  hashPassword(password: string): string {
    return bcrypt.hashSync(password, saltRounds);
  }

  protected prepareEntityBeforeSave(dto: DeepPartial<User>, parsed: CrudRequest['parsed']): User {
    this.updateHashedPassword(dto);

    return super.prepareEntityBeforeSave(dto, parsed);
  }

  private updateHashedPassword(dto: DeepPartial<User>) {
    if (dto.password) {
      dto.passwordHash = this.hashPassword(dto.password);
      dto.password = undefined;
    }
  }

  private async checkExistingUserId(user: DeepPartial<User>) {
    if (user.id) {
      const existingUser = await this.repo.findOne(user.id);
      if (existingUser) {
        // TODO It's more secure to return a status Ok and send an e-mail to the registered user with a password reset,
        // this way a hacker wouldn't be able to discover the list of users
        this.throwDuplicateUserException(user);
      }
    }
  }

  private async getCurrentEmail(dto: DeepPartial<User>) {
    const existingUser = await this.findOne(dto.id);

    let oldEmail: string;

    if (existingUser) {
      oldEmail = existingUser.email;
    }

    return oldEmail;
  }

  private async checkEmailChanged(savedUser: User, oldEmail: string) {
    if (savedUser.email !== oldEmail) {
      await this.verificationService.generateValidationToken(savedUser);
    }
  }

  private translateError(e: any, userDto: DeepPartial<User>) {
    if (e instanceof QueryFailedError) {
      if ((e as any).code === 'ER_DUP_ENTRY') {
        this.throwDuplicateUserException(userDto);
      } else {
        throw new BadRequestException(e.message);
      }
    }
    throw e;
  }

  private throwDuplicateUserException(userDto: DeepPartial<User>) {
    throw new DuplicateUserException(userDto.email);
  }
}
