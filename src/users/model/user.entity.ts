import { ApiResponseProperty } from '@nestjs/swagger';
import { CrudValidationGroups } from '@nestjsx/crud';
import { Exclude } from 'class-transformer';
import { IsDefined, IsEnum, IsOptional, IsString } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { UserRoles } from './users.roles';

const { CREATE, UPDATE } = CrudValidationGroups;

/**
 * Defines an user model to be persisted.
 */
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  @IsOptional({ always: true })
  @ApiResponseProperty()
  id?: number;

  @Column({ unique: true })
  @IsString()
  @IsOptional({ groups: [UPDATE] })
  @ApiResponseProperty()
  username: string;

  @Column()
  @Exclude({ toPlainOnly: true })
  passwordHash: string;

  @Exclude({ toPlainOnly: true })
  @IsDefined({ groups: [CREATE] })
  @IsOptional({ groups: [UPDATE] })
  @IsString()
  password: string;

  @Column({ type: 'enum', default: UserRoles.User, enum: Object.keys(UserRoles) })
  @IsEnum(UserRoles)
  @IsOptional({ always: true })
  @ApiResponseProperty()
  role: UserRoles;
}
