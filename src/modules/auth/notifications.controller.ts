import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CurrentUser } from './decorators/current-user.decorator';
import { Notification } from './entities/notification.entity';

@Controller('notifications')
export class NotificationsController {
  constructor(@InjectRepository(Notification) private repo: Repository<Notification>) {}

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  @Get('unread-count')
  async unreadCount(@CurrentUser('id') userId: string) {
    const count = await this.repo.count({ where: { userId, read: false } });
    return { count };
  }

  @Patch(':id/read')
  async markRead(@CurrentUser('id') userId: string, @Param('id') id: string) {
    await this.repo.update({ id, userId }, { read: true });
    return { message: 'Marked as read' };
  }

  @Patch('read-all')
  async markAllRead(@CurrentUser('id') userId: string) {
    await this.repo.update({ userId, read: false }, { read: true });
    return { message: 'All marked as read' };
  }

  @Delete(':id')
  async remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    await this.repo.delete({ id, userId });
    return { message: 'Deleted' };
  }

  @Delete()
  async clear(@CurrentUser('id') userId: string) {
    await this.repo.delete({ userId });
    return { message: 'Cleared' };
  }
}
