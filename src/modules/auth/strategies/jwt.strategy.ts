import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { RedisService } from '../../../common/services/redis.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private config: ConfigService,
    private redis: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.['access_token'] || null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_SECRET', 'movicol-jwt-secret-dev'),
    });
  }

  async validate(payload: { sub: string; email: string; role: string; sessionId: string }) {
    if (!payload.sub) throw new UnauthorizedException();

    // Check if session is blacklisted
    if (payload.sessionId) {
      const blacklisted = await this.redis.get(`blacklist:${payload.sessionId}`);
      if (blacklisted) throw new UnauthorizedException('Session revoked');
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      sessionId: payload.sessionId,
    };
  }
}
