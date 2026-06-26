import { Body, Controller, Get, Put } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CurrentUser } from './decorators/current-user.decorator';
import { UserPreference } from './entities/user-preference.entity';

@Controller('preferences')
export class PreferencesController {
  constructor(@InjectRepository(UserPreference) private readonly repo: Repository<UserPreference>) {}

  @Get()
  async get(@CurrentUser('id') userId: string) {
    const pref = await this.repo.findOne({ where: { userId } });
    if (pref) return pref;
    const created = this.repo.create({ userId });
    await this.repo.save(created);
    return created;
  }

  @Put()
  async update(@CurrentUser('id') userId: string, @Body() body: Partial<UserPreference>) {
    let pref = await this.repo.findOne({ where: { userId } });
    if (!pref) {
      pref = this.repo.create({ userId, ...body });
    } else {
      Object.assign(pref, body);
    }
    return this.repo.save(pref);
  }
}
