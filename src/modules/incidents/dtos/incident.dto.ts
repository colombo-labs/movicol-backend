import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateIncidentDto {
  @ApiProperty({ example: 'demora' })
  @IsString()
  type: string;

  @ApiProperty({ example: 4.6097 })
  @IsNumber()
  lat: number;

  @ApiProperty({ example: -74.0817 })
  @IsNumber()
  lng: number;

  @ApiPropertyOptional({ example: '120' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  route_code?: string;

  @ApiPropertyOptional({ example: 'Bus no llegó en 20 min' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;
}

export class NotificationItemDto {
  id: string;
  title: string;
  body: string;
  type: string;
  severity: string;
  lat?: number;
  lng?: number;
  route_codes: string[];
  created_at: Date;
  source: string;
}
