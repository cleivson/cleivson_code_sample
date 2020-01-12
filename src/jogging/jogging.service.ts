import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CrudRequest, GetManyDefaultResponse } from '@nestjsx/crud';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { AdvancedQuery, TypeormQueryBuilderVisitor } from 'query';
import { Repository } from 'typeorm';
import { User } from 'users';
import { InvalidUserException } from './exceptions/invalid-user.exception';
import { JoggingEntry } from './model';
import moment = require('moment');

@Injectable()
export class JoggingService extends TypeOrmCrudService<JoggingEntry> {
  constructor(@InjectRepository(JoggingEntry) repository: Repository<JoggingEntry>) {
    super(repository);
  }

  async createJoggingEntry(joggingEntry: JoggingEntry): Promise<JoggingEntry> {
    if (joggingEntry.id) {
      this.throwBadRequestException('New jogging entry entry should not have an id.');
    }

    return this.saveJoggingEntry(joggingEntry);
  }

  async updateJoggingEntry(joggingEntry: JoggingEntry): Promise<JoggingEntry> {
    const existingJoggingEntry = await this.repo.findOne(joggingEntry.id);

    if (!existingJoggingEntry) {
      this.throwNotFoundException(this.repo.metadata.targetName);
    }

    return this.saveJoggingEntry(joggingEntry);
  }

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

  async deleteJoggingEntry(joggingEntryId: number): Promise<void | JoggingEntry> {
    const existingJoggingEntry = await this.repo.findOne({ id: joggingEntryId });

    if (!existingJoggingEntry) {
      throw new NotFoundException();
    }

    const ownerUser = await this.repo.manager.getRepository(User).findOne(existingJoggingEntry.userId, { select: ['id'] });

    if (!ownerUser) {
      throw new InvalidUserException();
    }

    try {
      await this.repo.remove([existingJoggingEntry]);
    } catch (e) {
      this.translateError(e);
    }
  }

  async getJoggingEntries(req: CrudRequest, originalQuery: AdvancedQuery<JoggingEntry>, userId?: number)
    : Promise<GetManyDefaultResponse<JoggingEntry> | JoggingEntry[]> {

    const { parsed, options } = req;

    const queryBuilder = await this.createBuilder(parsed, options);

    TypeormQueryBuilderVisitor.applyQuery(originalQuery, queryBuilder);

    if (userId) {
      const injectedParamName = 'userId';
      queryBuilder.andWhere(`userId = :${injectedParamName}`);
      queryBuilder.setParameter(injectedParamName, userId);
    }

    const { raw, entities } = await queryBuilder.getRawAndEntities();

    return entities;
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
      throw new BadRequestException();
    }
    throw e;
  }
}
