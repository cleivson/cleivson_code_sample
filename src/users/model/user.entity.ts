import { ApiPropertyOptional } from '@nestjs/swagger';
import { CrudValidationGroups } from '@nestjsx/crud';
import { Exclude } from 'class-transformer';
import { IsDefined, IsEnum, IsOptional } from 'class-validator';
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
  @ApiPropertyOptional()
  id?: number;

  @Column({ unique: true })
  @IsDefined({ groups: [CREATE] })
  @IsOptional({ groups: [UPDATE] })
  @ApiPropertyOptional()
  username: string;

  @Exclude({ toPlainOnly: true })
  @IsDefined({ groups: [CREATE, UPDATE] })
  @IsOptional({ groups: [UPDATE] })
  @ApiPropertyOptional({ writeOnly: true })
  password: string;

  @Column({ type: 'enum', default: UserRoles.User, enum: Object.keys(UserRoles) })
  @IsEnum(UserRoles)
  @IsOptional({ always: true })
  @ApiPropertyOptional()
  role: UserRoles;

  @Column()
  passwordHash: string;
}
