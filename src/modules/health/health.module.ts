import { Controller, Get, Module } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';

@Public()
@Controller('health')
class HealthController {
  @Get()
  check() {
    return { status: 'ok', service: 'movicol-backend', version: '0.1.0' };
  }
}

@Module({ controllers: [HealthController] })
export class HealthModule {}
