import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CurrentUser } from './decorators/current-user.decorator';
import { SavedRoute } from './entities/saved-route.entity';

@Controller('saved-routes')
export class SavedRoutesController {
  constructor(@InjectRepository(SavedRoute) private readonly repo: Repository<SavedRoute>) {}

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  @Post()
  create(
    @CurrentUser('id') userId: string,
    @Body()
    body: {
      originLabel: string;
      originLat: number;
      originLng: number;
      destLabel: string;
      destLat: number;
      destLng: number;
      estimatedMinutes?: number;
      mode?: string;
    },
  ) {
    const route = this.repo.create({ ...body, userId });
    return this.repo.save(route);
  }

  @Delete(':id')
  async remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    await this.repo.delete({ id, userId });
    return { message: 'Deleted' };
  }
}
