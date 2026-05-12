import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { PaginationParams } from '../../../common/interfaces/pagination.interface';
import { CreateStationDto } from '../dtos/station.dto';
import { StationsService } from '../services/stations.service';

@ApiTags('Stations')
@Controller('stations')
export class StationsController {
  constructor(private readonly stationsService: StationsService) {}

  @Get()
  @ApiOperation({ summary: 'List all stations (paginated)' })
  findAll(@Query() params: PaginationParams) {
    return this.stationsService.findAll(params);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get station by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.stationsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a station' })
  create(@Body() dto: CreateStationDto) {
    return this.stationsService.create(dto);
  }
}
