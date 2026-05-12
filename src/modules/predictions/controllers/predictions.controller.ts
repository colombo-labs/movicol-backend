import { Body, Controller, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { PredictRequestDto } from '../dtos/prediction.dto';
import { PredictionsService } from '../services/predictions.service';

@ApiTags('Predictions')
@Controller('predictions')
export class PredictionsController {
  constructor(private readonly predictionsService: PredictionsService) {}

  @Post()
  @ApiOperation({ summary: 'Predict congestion for a station' })
  predict(@Body() dto: PredictRequestDto) {
    return this.predictionsService.predict(dto);
  }

  @Post('batch')
  @ApiOperation({ summary: 'Predict congestion for all stations' })
  predictAll(
    @Query('dayOfWeek') dayOfWeek: number,
    @Query('hour') hour: number,
    @Query('horizonMinutes') horizonMinutes: number = 30,
  ) {
    return this.predictionsService.predictAll(dayOfWeek, hour, horizonMinutes);
  }
}
