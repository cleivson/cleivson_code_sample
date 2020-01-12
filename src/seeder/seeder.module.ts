import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from 'database';
import { User } from 'users';
import { SeederService } from './seeder.service';

@Module({
  imports: [TypeOrmModule.forFeature([User]), DatabaseModule],
  providers: [SeederService, Logger],
})
export class SeederModule { }
