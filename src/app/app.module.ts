import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { CommonModule } from '../common/common.module';
import configuration from '../config/configuration';
import { DatabaseModule } from '../database/database.module';
import { ChatModule } from '../modules/chat/chat.module';
import { HealthModule } from '../modules/health/health.module';
import { PredictionsModule } from '../modules/predictions/predictions.module';
import { RoutesModule } from '../modules/routes/routes.module';
import { StationsModule } from '../modules/stations/stations.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    CommonModule,
    DatabaseModule,
    HealthModule,
    StationsModule,
    RoutesModule,
    PredictionsModule,
    ChatModule,
  ],
})
export class AppModule {}
