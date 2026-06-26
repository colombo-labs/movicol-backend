import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { RedisService } from '../../../common/services/redis.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private redis: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) throw new ForbiddenException('No autenticado');

    // Get permissions from Redis cache
    const cached = await this.redis.get(`permissions:${user.id}`);
    const userPermissions: string[] = cached || [];

    const has = required.some((p) => userPermissions.includes(p));
    if (!has) {
      throw new ForbiddenException(`Permisos insuficientes. Requiere: ${required.join(', ')}`);
    }

    return true;
  }
}
