import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CrudRequest } from '@nestjsx/crud';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { AdvancedQuery, TypeormQueryBuilderVisitor } from 'query';
import { Repository } from 'typeorm';
import { User } from 'users';
import { InvalidUserException } from './exceptions/invalid-user.exception';
import { InvalidUserException } from './exceptions';
import { JoggingEntry } from './model';
import moment = require('moment');

/**
 * Provides the services that will be exposed by the controllers of this module.
 */
@Injectable()
export class JoggingService extends TypeOrmCrudService<JoggingEntry> {
  constructor(@InjectRepository(JoggingEntry) repository: Repository<JoggingEntry>) {
    super(repository);
  }

  /**
   * Registers a new jogging activity.
   * @param joggingEntry The jogging activity to be registered.
   * @throws BadRequestException if the jogging entry contains a fulfilled id.
   * @throws InvalidUserException if the user associated to the jogging entry does not exist in the database.
   * @returns The created jogging entry.
   */
  async createJoggingEntry(joggingEntry: JoggingEntry): Promise<JoggingEntry> {
    if (joggingEntry.id) {
      this.throwBadRequestException('New jogging entry entry should not have an id.');
    }

    return this.saveJoggingEntry(joggingEntry);
  }

  /**
   * Updates an existing jogging entry.
   * @param joggingEntry The jogging entry to be updated.
   * @throws NotFoundException if the jogging entry does not exist in the database.
   * @throws BadRequestException if the id of the user associated to the jogging entry is being updated.
   * @throws InvalidUserException if the user associated to the jogging entry does not exist in the database.
   * @returns The updated jogging entry.
   */
  async updateJoggingEntry(joggingEntry: JoggingEntry): Promise<JoggingEntry> {
    const existingJoggingEntry = await this.repo.findOne(joggingEntry.id);

    if (!existingJoggingEntry) {
      this.throwNotFoundException(this.repo.metadata.targetName);
    }

    return this.saveJoggingEntry(joggingEntry);
  }

  /**
   * Creates or updates a jogging entry.
   * @param joggingEntry The jogging entry to be updated.
   * @throws BadRequestException if the id of the user associated to the jogging entry is being updated.
   * @throws InvalidUserException if the user associated to the jogging entry does not exist in the database.
   * @returns The saved jogging entry.
   */
  async saveJoggingEntry(joggingEntry: JoggingEntry): Promise<JoggingEntry> {
    if (joggingEntry.id) {
      await this.validateUserNotChanged(joggingEntry);
    }

    const ownerUser = await this.repo.manager.getRepository(User).findOne(joggingEntry.userId, { select: ['id'] });

    if (!ownerUser) {
      throw new InvalidUserException();
    }

    try {
      return await this.repo.save(joggingEntry);
    } catch (e) {
      this.translateError(e);
    }
  }

  /**
   * Fetches the jogging entries from the database according to the given criteria.
   * @param req The CrudRequest that contains information like pagination, offset, sort key, ... about the query in the database.
   * @param originalQuery The user query to filter the results to be returned.
   * @param userId The id of the user related to the entries to be returned.
   * @returns Array with the jogging entries in the database that meet the given criteria.
   */
  async getJoggingEntries(req: CrudRequest, originalQuery: AdvancedQuery<JoggingEntry>, userId?: number)
    : Promise<JoggingEntry[]> {

    const { parsed, options } = req;

    const queryBuilder = await this.createBuilder(parsed, options);

    TypeormQueryBuilderVisitor.applyQuery(originalQuery, queryBuilder);

    if (userId) {
      const injectedParamName = 'userId';
      queryBuilder.andWhere(`userId = :${injectedParamName}`);
      queryBuilder.setParameter(injectedParamName, userId);
    }

    try {
      const { raw, entities } = await queryBuilder.getRawAndEntities();

      return entities;
    } catch (e) {
      this.translateError(e);
    }
  }

  private async validateUserNotChanged(joggingEntry: JoggingEntry) {
    const existingJoggingEntry = await this.repo.findOne(joggingEntry.id);
    if (!existingJoggingEntry) {
      this.throwNotFoundException(this.repo.metadata.targetName);
    }
    if (joggingEntry.userId && existingJoggingEntry.userId !== joggingEntry.userId) {
      this.throwBadRequestException('Cannot change the user associated to a joggingEntry entry.');
    }
  }

  private translateError(e: any) {
    if (e.name === 'QueryFailedError') {
      throw new BadRequestException(e.message);
    }
    throw e;
  }
}
