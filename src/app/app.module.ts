import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';

import { CommonModule } from '../common/common.module';
import configuration from '../config/configuration';
import { AuthModule } from '../modules/auth/auth.module';
import { AdminModule } from '../modules/admin/admin.module';
import { FavoritesModule } from '../modules/favorites/favorites.module';
import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';
import { ChatModule } from '../modules/chat/chat.module';
import { GraphModule } from '../modules/graph/graph.module';
import { HealthModule } from '../modules/health/health.module';
import { PredictionsModule } from '../modules/predictions/predictions.module';
import { RoutePredictionModule } from '../modules/route-prediction/route-prediction.module';
import { RoutesModule } from "../modules/routes/routes.module";
import { StationsModule } from "../modules/stations/stations.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5434),
        username: config.get('DB_USERNAME', 'movicol'),
        password: config.get('DB_PASSWORD', 'movicol_dev'),
        database: config.get('DB_DATABASE', 'movicol'),
        autoLoadEntities: true,
        synchronize: config.get('NODE_ENV') !== 'production',
      }),
    }),
    CommonModule,
    AuthModule,
    AdminModule,
    FavoritesModule,
    HealthModule,
    GraphModule,
    PredictionsModule,
    RoutePredictionModule,
    RoutesModule,
    StationsModule,
    ChatModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
