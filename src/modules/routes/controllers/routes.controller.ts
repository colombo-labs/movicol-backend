import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { PaginationParams } from '../../../common/interfaces/pagination.interface';
import { RoutesService } from '../services/routes.service';

@ApiTags('Routes')
@Controller('routes')
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Get()
  @ApiOperation({ summary: 'List all routes (paginated)' })
  findAll(@Query() params: PaginationParams) {
    return this.routesService.findAll(params);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get route by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.routesService.findOne(id);
  }

  @Get('station/:stationId')
  @ApiOperation({ summary: 'Get routes by station' })
  findByStation(@Param('stationId', ParseUUIDPipe) stationId: string) {
    return this.routesService.findByStation(stationId);
  }
}
