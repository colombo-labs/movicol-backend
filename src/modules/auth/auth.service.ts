import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { RedisService } from '../../common/services/redis.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(RefreshToken) private refreshRepo: Repository<RefreshToken>,
    @InjectRepository(RolePermission) private rolePermRepo: Repository<RolePermission>,
    private jwt: JwtService,
    private redis: RedisService,
  ) {}

  async findOrCreateUser(profile: {
    googleId: string;
    email: string;
    name: string;
    avatarUrl: string | null;
  }): Promise<User> {
    let user = await this.userRepo.findOne({ where: { googleId: profile.googleId } });

    if (!user) {
      user = this.userRepo.create({
        googleId: profile.googleId,
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.avatarUrl || undefined,
        roleId: 1,
      });
      user = await this.userRepo.save(user);
    }

    user.lastLogin = new Date();
    await this.userRepo.save(user);

    // Cache permissions in Redis
    await this.cachePermissions(user);

    return user;
  }

  async generateTokens(user: User) {
    const sessionId = uuid();
    const payload = { sub: user.id, email: user.email, role: user.role?.name || 'user', sessionId };

    const accessToken = this.jwt.sign(payload, { expiresIn: '15m' });
    const refreshToken = uuid();

    // Store refresh token hash in DB
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.refreshRepo.save({
      userId: user.id,
      tokenHash: hash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    // Store session in Redis
    await this.redis.set(`session:${sessionId}`, { userId: user.id }, 604800);

    return { accessToken, refreshToken };
  }

  async refreshAccessToken(token: string) {
    const records = await this.refreshRepo.find({
      where: { revoked: false },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: 10,
    });

    for (const record of records) {
      const valid = await bcrypt.compare(token, record.tokenHash);
      if (valid && record.expiresAt > new Date()) {
        // Revoke old token (rotation)
        record.revoked = true;
        await this.refreshRepo.save(record);

        // Generate new pair
        const user = await this.userRepo.findOne({ where: { id: record.userId }, relations: ['role'] });
        if (!user) return null;

        return this.generateTokens(user);
      }
    }
    return null;
  }

  async cachePermissions(user: User) {
    const rolePerms = await this.rolePermRepo.find({
      where: { roleId: user.roleId },
      relations: ['permission'],
    });

    const permissions = rolePerms.map((rp) => rp.permission.key);
    await this.redis.set(`permissions:${user.id}`, permissions, 3600);
    return permissions;
  }

  async getMe(userId: string) {
    return this.userRepo.findOne({ where: { id: userId }, relations: ['role'] });
  }

  async logout(sessionId: string) {
    await this.redis.del(`session:${sessionId}`);
  }
}
