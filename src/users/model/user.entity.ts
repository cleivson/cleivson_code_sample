import { ApiPropertyOptional } from '@nestjs/swagger';
import { CrudValidationGroups } from '@nestjsx/crud';
import { Exclude } from 'class-transformer';
import { IsDefined, IsEmail, IsEnum, IsOptional } from 'class-validator';
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
  @IsOptional({ always: true })
  @ApiPropertyOptional()
  role?: UserRoles;

  // TODO Think about separating the user account from the user profile
  // TODO Test that this value cannot be edited directly through the API
  /**
   * Asserts that the user has already verified his/her account.
   */
  @Column({ default: false })
  verified?: boolean;

  /**
   * The account of the user is locked.
   */
  @Column({ default: false })
  locked?: boolean;

  @Column({ default: 0 })
  incorrectLogins?: number;

  @Column()
  passwordHash?: string;
}
