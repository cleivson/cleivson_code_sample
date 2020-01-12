import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JoggingController } from './jogging.controller';
import { JoggingService } from './jogging.service';
import { JoggingEntry } from './model';
import { UserJoggingController } from './user-jogging.controller';

@Module({
  imports: [TypeOrmModule.forFeature([JoggingEntry])],
  controllers: [JoggingController, UserJoggingController],
  providers: [JoggingService],
})
export class JoggingModule { }