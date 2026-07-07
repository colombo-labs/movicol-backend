import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AppContextDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  module?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  origin?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  destination?: string;

  @IsOptional()
  @IsNumber({}, { each: true })
  @ApiPropertyOptional({ type: [Number] })
  originCoords?: number[];

  @IsOptional()
  @IsNumber({}, { each: true })
  @ApiPropertyOptional({ type: [Number] })
  destinationCoords?: number[];

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  activeRoute?: string;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional()
  selectedHour?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  transportMode?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ default: 'es' })
  language?: string = 'es';
}

export class ChatRequestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  @ApiProperty({ description: 'User message' })
  message: string;

  @IsString()
  @ApiPropertyOptional({ default: 'default' })
  sessionId?: string = 'default';

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AppContextDto)
  @ApiPropertyOptional({ type: AppContextDto })
  context?: AppContextDto;
}

export class ActionPayloadDto {
  @ApiProperty()
  type: string;

  @ApiProperty()
  data: Record<string, unknown>;
}

export class ChatResponseDto {
  @ApiProperty()
  response: string;

  @ApiProperty({ type: [String] })
  sources: string[];

  @ApiProperty()
  sessionId: string;

  @ApiPropertyOptional({ type: [ActionPayloadDto] })
  actions?: ActionPayloadDto[];
}
