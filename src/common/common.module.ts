import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { HttpClientService } from './services/http-client.service';
import { RedisService } from './services/redis.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [HttpClientService, RedisService],
  exports: [HttpClientService, RedisService],
})
export class CommonModule {}
