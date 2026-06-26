import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ArcGisService } from './services/arcgis.service';
import { HttpClientService } from './services/http-client.service';
import { RedisService } from './services/redis.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [HttpClientService, RedisService, ArcGisService],
  exports: [HttpClientService, RedisService, ArcGisService],
})
export class CommonModule {}
