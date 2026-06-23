import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FavoritesController } from './favorites.controller';
import { UserFavorite } from '../auth/entities/user-favorite.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserFavorite])],
  controllers: [FavoritesController],
})
export class FavoritesModule {}
