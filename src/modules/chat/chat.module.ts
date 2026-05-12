import { Module } from '@nestjs/common';

import { ChatController } from './controllers/chat.controller';
import { ChatGateway } from './gateways/chat.gateway';
import { ChatService } from './services/chat.service';

@Module({
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
})
export class ChatModule {}
