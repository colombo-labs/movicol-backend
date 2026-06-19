import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  PaginatedResponse,
  PaginationParams,
} from '../../../common/interfaces/pagination.interface';
import { CreateStationDto } from '../dtos/station.dto';
import { Station } from '../entities/station.entity';

@Injectable()
export class StationsService {
  constructor(
    @InjectRepository(Station)
    private readonly stationRepo: Repository<Station>,
  ) {}

  async findAll(params: PaginationParams): Promise<PaginatedResponse<Station>> {
    const [data, total] = await this.stationRepo.findAndCount({
      take: params.limit,
      skip: params.offset,
      order: { name: 'ASC' },
    });
    return { data, total, limit: params.limit ?? 20, offset: params.offset ?? 0 };
  }

  async findOne(id: string): Promise<Station> {
    const station = await this.stationRepo.findOneBy({ id });
    if (!station) throw new NotFoundException(`Station ${id} not found`);
    return station;
  }

  async create(dto: CreateStationDto): Promise<Station> {
    const station = this.stationRepo.create(dto);
    return this.stationRepo.save(station);
  }
}
