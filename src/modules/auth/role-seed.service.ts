import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';

/**
 * Ensures default roles exist in the database on application startup.
 * Role IDs:
 *  1 = admin (system)
 *  2 = user (default for new registrations)
 */
@Injectable()
export class RoleSeedService implements OnModuleInit {
  constructor(@InjectRepository(Role) private readonly roleRepo: Repository<Role>) {}

  async onModuleInit() {
    const roles = [
      { id: 1, name: 'admin', description: 'Administrador del sistema', isSystem: true },
      { id: 2, name: 'user', description: 'Usuario regular', isSystem: true },
    ];

    for (const roleDef of roles) {
      const existing = await this.roleRepo.findOne({ where: { id: roleDef.id } });
      if (!existing) {
        await this.roleRepo.save(this.roleRepo.create(roleDef));
        console.log(`[RoleSeed] Created role: ${roleDef.name} (id=${roleDef.id})`);
      }
    }
  }
}
