import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '../../auth/decorators/public.decorator';
import { CreateIncidentDto } from '../dtos/incident.dto';
import { IncidentsService } from '../services/incidents.service';

@ApiTags('Incidents & Notifications')
@Public()
@Controller()
export class IncidentsController {
  constructor(private readonly service: IncidentsService) {}

  @Post('incidents')
  @ApiOperation({ summary: 'Report a new incident' })
  create(@Body() dto: CreateIncidentDto) {
    return this.service.create(dto);
  }

  @Post('incidents/:id/vote')
  @ApiOperation({ summary: 'Upvote an incident (confirm still active)' })
  vote(@Param('id', ParseIntPipe) id: number) {
    return this.service.vote(id).then((ok) => ({ ok }));
  }

  @Get('incidents/nearby')
  @ApiOperation({ summary: 'Get recent incidents near a location' })
  findNearby(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius_km') radiusKm = 1.0,
    @Query('hours') hours = 2,
  ) {
    return this.service.findNearby(+lat, +lng, +radiusKm, +hours);
  }

  @Get('notifications')
  @ApiOperation({ summary: 'Get unified notifications (incidents + alerts)' })
  getNotifications(@Query('hours') hours = 6) {
    return this.service.getNotifications(+hours);
  }
}
