import { Module } from '@nestjs/common';

import { RoutePredictionController } from './controllers/route-prediction.controller';
import { RoutePredictionService } from './services/route-prediction.service';

@Module({
  controllers: [RoutePredictionController],
  providers: [RoutePredictionService],
})
export class RoutePredictionModule {}
