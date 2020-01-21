import { ApiPropertyOptional } from '@nestjs/swagger';
import { CrudValidationGroups } from '@nestjsx/crud';
import { IsDefined, IsISO8601, IsNotEmpty, IsOptional, Min } from 'class-validator';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from 'users';

const { CREATE, UPDATE } = CrudValidationGroups;

/**
 * Represents the persisted jogging activity of a user.
 */
@Entity()
export class JoggingEntry {
  @PrimaryGeneratedColumn()
  @IsOptional({ groups: [CREATE] })
  id?: number;

  /**
   * The total travelled distance in meters.
   */
  @Column()
  @IsDefined({ groups: [CREATE] })
  @IsOptional({ groups: [UPDATE] })
  @Min(1)
  @ApiPropertyOptional({ description: 'The total travelled distance in meters', minimum: 1})
  distance?: number;

  /**
   * The jogging duration in time format (e.g.: 01:43:23).
   */
  @Column()
  @IsNotEmpty({ groups: [CREATE] })
  @ApiPropertyOptional({ description: 'The jogging duration', type: 'string', format: 'time', example: '00:55:43' })
  duration?: string;

  /**
   * The location where the jogging happened.
   */
  @Column()
  @IsNotEmpty({ groups: [CREATE] })
  @ApiPropertyOptional()
  location?: string;

  /**
   * The UTC date when the jogging happened.
   */
  @Column({ type: 'date' })
  @IsNotEmpty({ groups: [CREATE] })
  @IsISO8601()
  @ApiPropertyOptional({ description: 'The date when the jogging happened', type: 'string', format: 'date', example: '2020-01-15' })
  date: string;

  /**
   * The UTC time of day when the jogging happened.
   */
  @Column({ type: 'time' })
  @IsNotEmpty({ groups: [CREATE] })
  @ApiPropertyOptional({ type: 'string', format: 'time', example: '13:55:43' })
  time: string;

  /**
   * The id of user associated to this jogging entry.
   */
  @Column({ nullable: false })
  @IsOptional({ always: true })
  @ApiPropertyOptional()
  userId?: number;

  /**
   * The weather conditions in the time and place of the activity.
   */
  @Column()
  weatherCondition?: string;

  @ManyToOne(type => User, { onDelete: 'CASCADE' })
  user?: User;
}
