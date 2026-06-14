import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { CommonModule } from '../common/common.module';
import configuration from '../config/configuration';
import { ChatModule } from '../modules/chat/chat.module';
import { GraphModule } from '../modules/graph/graph.module';
import { HealthModule } from '../modules/health/health.module';
import { PredictionsModule } from '../modules/predictions/predictions.module';
import { RoutePredictionModule } from '../modules/route-prediction/route-prediction.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    CommonModule,
    HealthModule,
    GraphModule,
    PredictionsModule,
    RoutePredictionModule,
    ChatModule,
  ],
})
export class AppModule {}
