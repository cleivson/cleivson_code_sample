import { ApiProperty, ApiPropertyOptional, ApiResponseProperty } from '@nestjs/swagger';
import { CrudValidationGroups } from '@nestjsx/crud';
import { IsDefined, IsISO8601, IsOptional } from 'class-validator';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from 'users';

const { CREATE, UPDATE } = CrudValidationGroups;

@Entity()
export class JoggingEntry {
  @PrimaryGeneratedColumn()
  @IsOptional({ groups: [CREATE] })
  id?: number;

  @Column()
  @IsDefined({ groups: [CREATE] })
  @IsOptional({ groups: [UPDATE] })
  @ApiPropertyOptional()
  @ApiResponseProperty()
  distanceInMeters?: number;

  @Column()
  @IsDefined({ groups: [CREATE] })
  @ApiProperty({ type: 'string', format: 'time', example: '13:55:43' })
  @ApiResponseProperty()
  duration: string;

  @Column()
  @IsDefined({ groups: [CREATE] })
  @ApiProperty()
  @ApiResponseProperty()
  location: string;

  @Column({ type: 'date' })
  @IsDefined({ groups: [CREATE] })
  @IsISO8601()
  @ApiProperty({ type: 'string', format: 'date', example: '2020-01-15' })
  @ApiResponseProperty()
  date: string;

  @Column({ type: 'time' })
  @IsDefined({ groups: [CREATE] })
  @ApiProperty({ type: 'string', format: 'time', example: '13:55:43' })
  @ApiResponseProperty()
  time: string;

  @Column({ nullable: false })
  @IsDefined({ groups: [CREATE] })
  @IsOptional({ groups: [UPDATE] })
  userId?: number;

  @ManyToOne(type => User, { onDelete: 'CASCADE' })
  user?: User;
}
