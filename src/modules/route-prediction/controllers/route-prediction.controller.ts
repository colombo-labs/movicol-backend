import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  RoutePredictionRequestDto,
  RoutePredictionResponseDto,
} from '../dtos/route-prediction.dto';
import { RoutePredictionService } from '../services/route-prediction.service';

@ApiTags('Route Prediction')
@Controller('route-prediction')
export class RoutePredictionController {
  constructor(private readonly service: RoutePredictionService) {}

  @Get('alerts')
  @ApiOperation({ summary: 'Get system operational alerts' })
  getAlerts() {
    return this.service.getAlerts();
  }

  @Post()
  @ApiOperation({ summary: 'Predict optimal route with congestion risk' })
  predictRoute(@Body() dto: RoutePredictionRequestDto): Promise<RoutePredictionResponseDto> {
    return this.service.predictRoute(dto);
  }

  @Post('alternatives')
  @ApiOperation({ summary: 'Predict multiple route alternatives (vehicle)' })
  predictAlternatives(
    @Body() dto: RoutePredictionRequestDto,
  ): Promise<RoutePredictionResponseDto[]> {
    return this.service.predictAlternatives(dto);
  }
}
