import { Injectable } from '@nestjs/common';

import { HttpClientService } from '../../../common/services/http-client.service';
import { ChatRequestDto, ChatResponseDto } from '../dtos/chat.dto';

@Injectable()
export class ChatService {
  constructor(private readonly httpClient: HttpClientService) {}

  async chat(dto: ChatRequestDto): Promise<ChatResponseDto> {
    return this.httpClient.post<ChatResponseDto>('/agent/chat', {
      message: dto.message,
      session_id: dto.sessionId,
    });
  }
}
