import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';

import { Incident } from '../entities/incident.entity';
import { SystemAlert } from '../entities/system-alert.entity';
import { CreateIncidentDto, NotificationItemDto } from '../dtos/incident.dto';

@Injectable()
export class IncidentsService {
  constructor(
    @InjectRepository(Incident)
    private readonly incidentRepo: Repository<Incident>,
    @InjectRepository(SystemAlert)
    private readonly alertRepo: Repository<SystemAlert>,
  ) {}

  async create(dto: CreateIncidentDto): Promise<Incident> {
    const incident = this.incidentRepo.create({
      type: dto.type,
      lat: dto.lat,
      lng: dto.lng,
      routeCode: dto.route_code || '',
      description: dto.description || '',
      source: 'user_report',
    });
    return this.incidentRepo.save(incident);
  }

  async vote(id: number): Promise<boolean> {
    const result = await this.incidentRepo.increment({ id }, 'votes', 1);
    return (result.affected ?? 0) > 0;
  }

  async findNearby(lat: number, lng: number, radiusKm: number, hours: number): Promise<Incident[]> {
    const since = new Date(Date.now() - hours * 3600 * 1000);
    const delta = radiusKm / 111.0;
    return this.incidentRepo
      .createQueryBuilder('i')
      .where('i.createdAt > :since', { since })
      .andWhere('i.lat BETWEEN :latMin AND :latMax', {
        latMin: lat - delta,
        latMax: lat + delta,
      })
      .andWhere('i.lng BETWEEN :lngMin AND :lngMax', {
        lngMin: lng - delta,
        lngMax: lng + delta,
      })
      .orderBy('i.votes', 'DESC')
      .addOrderBy('i.createdAt', 'DESC')
      .limit(20)
      .getMany();
  }

  async getNotifications(hours: number): Promise<NotificationItemDto[]> {
    const since = new Date(Date.now() - hours * 3600 * 1000);
    const notifications: NotificationItemDto[] = [];

    // Recent incidents
    const incidents = await this.incidentRepo.find({
      where: { createdAt: MoreThan(since) },
      order: { createdAt: 'DESC' },
      take: 30,
    });

    for (const inc of incidents) {
      notifications.push({
        id: `incident-${inc.id}`,
        title: this.incidentTitle(inc.type),
        body:
          inc.description ||
          `Reportado por un usuario cerca de la ruta ${inc.routeCode || 'desconocida'}`,
        type: 'incident',
        severity: this.incidentSeverity(inc.type),
        lat: inc.lat,
        lng: inc.lng,
        route_codes: inc.routeCode ? [inc.routeCode] : [],
        created_at: inc.createdAt,
        source: 'user_report',
      });
    }

    // Recent system alerts
    const alerts = await this.alertRepo.find({
      where: { createdAt: MoreThan(since) },
      order: { createdAt: 'DESC' },
      take: 20,
    });

    for (const alert of alerts) {
      notifications.push({
        id: `alert-${alert.id}`,
        title: alert.title,
        body: `Rutas afectadas: ${(alert.routeCodes || []).join(', ')}`,
        type: 'alert',
        severity: alert.type === 'suspended' ? 'danger' : 'warning',
        route_codes: alert.routeCodes || [],
        created_at: alert.createdAt,
        source: 'scraping',
      });
    }

    notifications.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    return notifications.slice(0, 30);
  }

  private incidentTitle(type: string): string {
    const titles: Record<string, string> = {
      demora: '⏱ Demora reportada',
      lleno: '🚏 Bus lleno',
      inseguro: '⚠️ Zona insegura',
      cerrado: '🚫 Estación/paradero cerrado',
      accidente: '🚨 Accidente en la vía',
    };
    return titles[type] || `📍 Incidente: ${type}`;
  }

  private incidentSeverity(type: string): string {
    if (['accidente', 'cerrado'].includes(type)) return 'danger';
    if (['demora', 'inseguro'].includes(type)) return 'warning';
    return 'info';
  }
}
