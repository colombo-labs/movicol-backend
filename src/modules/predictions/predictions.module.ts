import { Module } from '@nestjs/common';

import { PredictionsController } from './controllers/predictions.controller';
import { PredictionsGateway } from './gateways/predictions.gateway';
import { PredictionsService } from './services/predictions.service';

@Module({
  controllers: [PredictionsController],
  providers: [PredictionsService, PredictionsGateway],
  exports: [PredictionsGateway],
})
export class PredictionsModule {}
