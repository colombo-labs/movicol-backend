import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy, OnModuleInit {
  private readonly client: Redis;

  constructor(private readonly config: ConfigService) {
    this.client = new Redis({
      host: this.config.get('REDIS_HOST', 'localhost'),
      port: this.config.get('REDIS_PORT', 6379),
      lazyConnect: true,
    });
  }

  async onModuleInit(): Promise<void> {
    await this.client.connect().catch(() => {});
  }

  async get(key: string): Promise<unknown> {
    try {
      const val = await this.client.get(key);
      return val ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, data: unknown, ttlSeconds: number): Promise<void> {
    try {
      await this.client.set(key, JSON.stringify(data), 'EX', ttlSeconds);
    } catch {}
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch {}
  }

  onModuleDestroy() {
    this.client.disconnect();
  }
}
