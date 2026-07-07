import { Injectable } from '@nestjs/common';

import { HttpClientService } from '../../../common/services/http-client.service';
import { ChatRequestDto, ChatResponseDto } from '../dtos/chat.dto';

interface AiChatResponse {
  response: string;
  sources: string[];
  session_id: string;
  actions?: Array<{ type: string; data: Record<string, unknown> }>;
}

@Injectable()
export class ChatService {
  constructor(private readonly httpClient: HttpClientService) {}

  async chat(dto: ChatRequestDto): Promise<ChatResponseDto> {
    const payload: Record<string, unknown> = {
      message: dto.message,
      session_id: dto.sessionId ?? 'default',
    };

    if (dto.context) {
      payload.context = {
        module: dto.context.module ?? null,
        origin: dto.context.origin ?? null,
        destination: dto.context.destination ?? null,
        origin_coords: dto.context.originCoords ?? null,
        destination_coords: dto.context.destinationCoords ?? null,
        active_route: dto.context.activeRoute ?? null,
        selected_hour: dto.context.selectedHour ?? null,
        transport_mode: dto.context.transportMode ?? null,
        language: dto.context.language ?? 'es',
      };
    }

    const result = await this.httpClient.post<AiChatResponse>(
      '/agent/chat',
      payload,
    );

    return {
      response: result.response,
      sources: result.sources,
      sessionId: result.session_id,
      actions: result.actions ?? [],
    };
  }
}
