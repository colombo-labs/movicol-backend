import { Injectable } from '@nestjs/common';

import { HttpClientService } from '../../../common/services/http-client.service';
import { PredictRequestDto, PredictResponseDto } from '../dtos/prediction.dto';

/**
 * Proxies prediction requests to the AI microservice.
 * Single Responsibility: only handles communication with AI service.
 */
@Injectable()
export class PredictionsService {
  constructor(private readonly httpClient: HttpClientService) {}

  async predict(dto: PredictRequestDto): Promise<PredictResponseDto> {
    return this.httpClient.post<PredictResponseDto>('/predictions', {
      station_id: dto.stationId,
      day_of_week: dto.dayOfWeek,
      hour: dto.hour,
      horizon_minutes: dto.horizonMinutes,
    });
  }

  async predictAll(dayOfWeek: number, hour: number, horizonMinutes: number): Promise<PredictResponseDto[]> {
    return this.httpClient.post<PredictResponseDto[]>('/predictions/batch', {
      day_of_week: dayOfWeek,
      hour,
      horizon_minutes: horizonMinutes,
    });
  }
}
