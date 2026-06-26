import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';

import { BaseGateway } from '../../../common/gateways/base.gateway';
import { WsEvent } from '../../../common/interfaces/ws-events.interface';
import { ChatService } from '../services/chat.service';

interface ChatMessagePayload {
  message: string;
  sessionId?: string;
}

/**
 * Chat WebSocket gateway — enables streaming responses from the LLM agent.
 * Reuses ChatService — zero logic duplication with the REST controller.
 */
@WebSocketGateway({ namespace: 'chat', cors: { origin: '*' } })
export class ChatGateway extends BaseGateway {
  constructor(private readonly chatService: ChatService) {
    super();
  }

  @SubscribeMessage(WsEvent.CHAT_MESSAGE)
  async handleMessage(
    @MessageBody() payload: ChatMessagePayload,
    @ConnectedSocket() client: Socket,
  ) {
    const sessionId = payload.sessionId ?? client.id;

    // Signal stream start
    this.emitToClient(client, WsEvent.CHAT_STREAM_START, { sessionId });

    try {
      // For now, use the full response (non-streaming).

      const response = await this.chatService.chat({
        message: payload.message,
        sessionId,
      });

      // Emit full response as single token (upgrade to streaming later)
      this.emitToClient(client, WsEvent.CHAT_STREAM_TOKEN, {
        token: response.response,
        sessionId,
      });

      // Signal stream end
      this.emitToClient(client, WsEvent.CHAT_STREAM_END, {
        sessionId,
        sources: response.sources,
      });
    } catch {
      this.emitToClient(client, WsEvent.ERROR, {
        message: 'Agent error',
        sessionId,
      });
    }
  }
}
