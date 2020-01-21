import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WeatherModule } from 'weather';
import { JoggingService } from './jogging.service';
import { JoggingEntry } from './model';
import { WeeklyReportGenerator } from './reports';
import { UserJoggingController } from './user-jogging.controller';

/**
 * Module that aggregates the features related to user's jogging activities.
 */
@Module({
  imports: [TypeOrmModule.forFeature([JoggingEntry]), WeatherModule],
  controllers: [UserJoggingController],
  providers: [JoggingService, WeeklyReportGenerator],
})
export class JoggingModule { }
