import { Injectable } from '@nestjs/common';

import { HttpClientService } from '../../../common/services/http-client.service';
import { ChatRequestDto, ChatResponseDto } from '../dtos/chat.dto';

interface AiChatResponse {
  response: string;
  sources: string[];
  session_id: string;
}

@Injectable()
export class ChatService {
  constructor(private readonly httpClient: HttpClientService) {}

  async chat(dto: ChatRequestDto): Promise<ChatResponseDto> {
    const result = await this.httpClient.post<AiChatResponse>('/agent/chat', {
      message: dto.message,
      session_id: dto.sessionId ?? 'default',
    });

    return {
      response: result.response,
      sources: result.sources,
      sessionId: result.session_id,
    };
  }
}
