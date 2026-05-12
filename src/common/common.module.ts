import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { HttpClientService } from './services/http-client.service';

/**
 * Global module that provides shared services to all modules.
 * No need to import CommonModule in each feature module.
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [HttpClientService],
  exports: [HttpClientService],
})
export class CommonModule {}
