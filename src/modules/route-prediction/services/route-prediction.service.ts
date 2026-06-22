import { Injectable } from '@nestjs/common';

import { HttpClientService } from '../../../common/services/http-client.service';
import {
  RoutePredictionRequestDto,
  RoutePredictionResponseDto,
} from '../dtos/route-prediction.dto';

@Injectable()
export class RoutePredictionService {
  constructor(private readonly httpClient: HttpClientService) {}

  async predictRoute(dto: RoutePredictionRequestDto): Promise<RoutePredictionResponseDto> {
    return this.httpClient.post<RoutePredictionResponseDto>('/api/v1/predict-route', dto);
  }

  async predictAlternatives(dto: RoutePredictionRequestDto): Promise<RoutePredictionResponseDto[]> {
    return this.httpClient.post<RoutePredictionResponseDto[]>(
      '/api/v1/predict-route/alternatives',
      dto,
    );
  }

  async getAlerts(): Promise<any> {
    return this.httpClient.get('/api/v1/predict-route/alerts');
  }
}
