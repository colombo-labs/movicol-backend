import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PaginatedResponse, PaginationParams } from '../../../common/interfaces/pagination.interface';
import { Route } from '../entities/route.entity';

@Injectable()
export class RoutesService {
  constructor(
    @InjectRepository(Route)
    private readonly routeRepo: Repository<Route>,
  ) {}

  async findAll(params: PaginationParams): Promise<PaginatedResponse<Route>> {
    const [data, total] = await this.routeRepo.findAndCount({
      take: params.limit,
      skip: params.offset,
      order: { name: 'ASC' },
    });
    return { data, total, limit: params.limit, offset: params.offset };
  }

  async findOne(id: string): Promise<Route> {
    const route = await this.routeRepo.findOneBy({ id });
    if (!route) throw new NotFoundException(`Route ${id} not found`);
    return route;
  }

  async findByStation(stationId: string): Promise<Route[]> {
    return this.routeRepo.find({
      where: [{ originStationId: stationId }, { destinationStationId: stationId }],
    });
  }
}
