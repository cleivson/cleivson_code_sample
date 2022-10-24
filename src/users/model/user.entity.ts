import { ApiPropertyOptional } from '@nestjs/swagger';
import { CrudValidationGroups } from '@nestjsx/crud';
import { Exclude } from 'class-transformer';
import { IsDefined, IsEmail, IsEmpty, IsEnum, IsOptional } from 'class-validator';
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

  @Column()
  @IsDefined({ groups: [CREATE] })
  @IsOptional({ groups: [UPDATE] })
  @ApiPropertyOptional()
  firstName?: string;

  @Column()
  @IsDefined({ groups: [CREATE] })
  @IsOptional({ groups: [UPDATE] })
  @ApiPropertyOptional()
  lastName?: string;

  @Column({ unique: true })
  @IsEmail()
  @IsDefined({ groups: [CREATE] })
  @IsOptional({ groups: [UPDATE] })
  @ApiPropertyOptional()
  email: string;

  @Exclude({ toPlainOnly: true })
  @IsDefined({ groups: [CREATE, UPDATE] })
  @IsOptional({ groups: [UPDATE] })
  @ApiPropertyOptional({ writeOnly: true })
  password?: string;

  @Column({ type: 'enum', default: UserRoles.User, enum: Object.keys(UserRoles) })
  @IsEnum(UserRoles)
  @IsOptional()
  @ApiPropertyOptional({ enum: Object.keys(UserRoles) })
  role?: UserRoles;

  /**
   * The account of the user is locked.
   */
  @Column({ default: false })
  @IsOptional({ always: true })
  @ApiPropertyOptional()
  locked?: boolean;

  /**
   * Asserts that the user has already verified his/her account.
   */
  @IsOptional({ always: true })
  @Column({ default: false })
  verified?: boolean;

  @IsOptional({ always: true })
  @Column({ default: 0 })
  incorrectLogins?: number;

  @IsOptional({ always: true })
  @Column()
  passwordHash?: string;
}
