import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Reusable HTTP client for inter-service communication.
 * Used by any module that needs to call the AI microservice.
 */
@Injectable()
export class HttpClientService {
  private readonly aiBaseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.aiBaseUrl = this.config.get<string>('ai.serviceUrl', 'http://localhost:8000');
  }

  async get<T>(path: string): Promise<T> {
    const response = await fetch(`${this.aiBaseUrl}${path}`);
    if (!response.ok) {
      throw new HttpException(
        `AI service error: ${response.statusText}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
    return response.json() as Promise<T>;
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${this.aiBaseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new HttpException(
        `AI service error: ${response.statusText}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
    return response.json() as Promise<T>;
  }
}
