import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class ChatRequestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  @ApiProperty({ description: 'User message' })
  message: string;

  @IsString()
  @ApiPropertyOptional({ default: 'default' })
  sessionId?: string = 'default';
}

export class ChatResponseDto {
  @ApiProperty()
  response: string;

  @ApiProperty({ type: [String] })
  sources: string[];

  @ApiProperty()
  sessionId: string;
}
