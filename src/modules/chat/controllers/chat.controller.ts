import { Public } from '../../auth/decorators/public.decorator';
import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { ChatRequestDto } from '../dtos/chat.dto';
import { ChatService } from '../services/chat.service';

@ApiTags('Chat')
@Public()
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @ApiOperation({ summary: 'Send message to conversational agent' })
  chat(@Body() dto: ChatRequestDto) {
    return this.chatService.chat(dto);
  }
}
