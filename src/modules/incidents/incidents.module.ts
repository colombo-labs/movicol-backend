import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Incident } from './entities/incident.entity';
import { SystemAlert } from './entities/system-alert.entity';
import { IncidentsController } from './controllers/incidents.controller';
import { IncidentsService } from './services/incidents.service';

@Module({
  imports: [TypeOrmModule.forFeature([Incident, SystemAlert])],
  controllers: [IncidentsController],
  providers: [IncidentsService],
  exports: [IncidentsService],
})
export class IncidentsModule {}
