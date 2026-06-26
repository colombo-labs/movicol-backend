import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserFavorite } from '../auth/entities/user-favorite.entity';

@Controller('user/favorites')
export class FavoritesController {
  constructor(@InjectRepository(UserFavorite) private favRepo: Repository<UserFavorite>) {}

  @Get()
  async list(@CurrentUser('id') userId: string) {
    if (!userId) return [];
    return this.favRepo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body() body: { type: string; label: string; data: Record<string, any> },
  ) {
    if (!userId) return { error: 'Not authenticated' };
    return this.favRepo.save(this.favRepo.create({ userId, ...body }));
  }

  @Delete(':id')
  async remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    await this.favRepo.delete({ id, userId });
    return { message: 'Deleted' };
  }
}
