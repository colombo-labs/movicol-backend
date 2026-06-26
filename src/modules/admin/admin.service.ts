import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { Role } from '../auth/entities/role.entity';
import { Permission } from '../auth/entities/permission.entity';
import { RolePermission } from '../auth/entities/role-permission.entity';
import { UserPermission } from './entities/user-permission.entity';
import { RedisService } from '../../common/services/redis.service';
import { UserGateway } from '../auth/gateways/user.gateway';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(Permission) private permissionRepo: Repository<Permission>,
    @InjectRepository(RolePermission) private rolePermRepo: Repository<RolePermission>,
    @InjectRepository(UserPermission) private userPermRepo: Repository<UserPermission>,
    private redis: RedisService,
    private userGateway: UserGateway,
  ) {}

  // ==================== USERS ====================

  async findAllUsers() {
    return this.userRepo.find({ relations: ['role'], order: { createdAt: 'DESC' } });
  }

  async updateUserRole(userId: string, roleId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    user.roleId = roleId;
    await this.userRepo.save(user);
    await this.invalidateUserPermissions(userId);
    this.userGateway.notifyUserUpdated(Number(userId));
    return { message: 'Rol actualizado' };
  }

  async toggleUserStatus(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    user.isActive = !user.isActive;
    await this.userRepo.save(user);
    if (!user.isActive) this.userGateway.notifyForceLogout(Number(userId), 'account_disabled');
    else this.userGateway.notifyUserUpdated(Number(userId));
    return { isActive: user.isActive };
  }

  async getUserEffectivePermissions(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    // Role permissions
    const rolePerms = await this.rolePermRepo.find({
      where: { roleId: user.roleId },
      relations: ['permission'],
    });

    // User extra permissions
    const userPerms = await this.userPermRepo.find({
      where: { userId },
      relations: ['permission'],
    });

    return {
      rolePermissions: rolePerms.map((rp) => rp.permission),
      extraPermissions: userPerms.map((up) => up.permission),
      effective: [
        ...new Set([
          ...rolePerms.map((rp) => rp.permission.key),
          ...userPerms.map((up) => up.permission.key),
        ]),
      ],
    };
  }

  async setUserExtraPermissions(userId: string, permissionIds: number[]) {
    await this.userPermRepo.delete({ userId });
    if (permissionIds.length > 0) {
      const entities = permissionIds.map((permissionId) =>
        this.userPermRepo.create({ userId, permissionId }),
      );
      await this.userPermRepo.save(entities);
    }
    await this.invalidateUserPermissions(userId);
    this.userGateway.notifyUserUpdated(Number(userId));
    return { message: 'Permisos extra actualizados' };
  }

  // ==================== ROLES ====================

  async findAllRoles() {
    const roles = await this.roleRepo.find({
      relations: ['rolePermissions', 'rolePermissions.permission'],
      order: { id: 'ASC' },
    });
    return roles.map((r) => ({
      ...r,
      permissions: r.rolePermissions?.map((rp) => rp.permission) || [],
      rolePermissions: undefined,
    }));
  }

  async createRole(name: string, description?: string) {
    const existing = await this.roleRepo.findOne({ where: { name } });
    if (existing) throw new BadRequestException('El rol ya existe');
    return this.roleRepo.save(this.roleRepo.create({ name, description }));
  }

  async updateRole(id: number, data: { name?: string; description?: string }) {
    const role = await this.roleRepo.findOne({ where: { id } });
    if (!role) throw new NotFoundException('Rol no encontrado');
    if (role.isSystem) throw new BadRequestException('No se puede modificar un rol del sistema');
    Object.assign(role, data);
    return this.roleRepo.save(role);
  }

  async deleteRole(id: number) {
    const role = await this.roleRepo.findOne({ where: { id } });
    if (!role) throw new NotFoundException('Rol no encontrado');
    if (role.isSystem) throw new BadRequestException('No se puede eliminar un rol del sistema');
    await this.roleRepo.remove(role);
    return { message: 'Rol eliminado' };
  }

  async setRolePermissions(roleId: number, permissionIds: number[]) {
    await this.rolePermRepo.delete({ roleId });
    if (permissionIds.length > 0) {
      const entities = permissionIds.map((permissionId) =>
        this.rolePermRepo.create({ roleId, permissionId }),
      );
      await this.rolePermRepo.save(entities);
    }
    // Invalidate cache for all users with this role
    const users = await this.userRepo.find({ where: { roleId } });
    for (const u of users) {
      await this.invalidateUserPermissions(u.id);
      this.userGateway.notifyUserUpdated(Number(u.id));
    }
    return { message: 'Permisos del rol actualizados' };
  }

  // ==================== PERMISSIONS ====================

  async findAllPermissions() {
    return this.permissionRepo.find({ order: { module: 'ASC', action: 'ASC' } });
  }

  async createPermission(data: { module: string; action: string; description?: string }) {
    const key = `${data.module}.${data.action}`;
    const existing = await this.permissionRepo.findOne({ where: { key } });
    if (existing) throw new BadRequestException(`El permiso ${key} ya existe`);
    return this.permissionRepo.save(this.permissionRepo.create({ ...data, key }));
  }

  async deletePermission(id: number) {
    const perm = await this.permissionRepo.findOne({ where: { id } });
    if (!perm) throw new NotFoundException('Permiso no encontrado');
    await this.permissionRepo.remove(perm);
    return { message: 'Permiso eliminado' };
  }

  // ==================== CACHE ====================

  private async invalidateUserPermissions(userId: string) {
    await this.redis.del(`permissions:${userId}`);
  }
}
