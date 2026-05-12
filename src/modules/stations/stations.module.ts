import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { StationsController } from './controllers/stations.controller';
import { Station } from './entities/station.entity';
import { StationsService } from './services/stations.service';

@Module({
  imports: [TypeOrmModule.forFeature([Station])],
  controllers: [StationsController],
  providers: [StationsService],
  exports: [StationsService],
})
export class StationsModule {}
