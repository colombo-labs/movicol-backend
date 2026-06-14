import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsDateString, IsNumber, ValidateNested } from 'class-validator';

export class CoordinatesDto {
  @IsNumber()
  @ApiProperty({ example: 4.6097 })
  lat: number;

  @Transform(({ value, obj }) => value ?? obj?.lon)
  @IsNumber()
  @ApiProperty({
    example: -74.0817,
    description: 'Longitud. Se acepta también el alias lon en el payload.',
  })
  lng: number;
}

export class RoutePredictionRequestDto {
  @ValidateNested()
  @Type(() => CoordinatesDto)
  @ApiProperty({ type: CoordinatesDto })
  origin: CoordinatesDto;

  @ValidateNested()
  @Type(() => CoordinatesDto)
  @ApiProperty({ type: CoordinatesDto })
  destination: CoordinatesDto;

  @IsDateString()
  @ApiProperty({ example: '2026-05-20T08:00:00Z' })
  departure_time: string;

  @ApiProperty({ example: 'transmilenio', description: 'transmilenio | sitp | vehiculo' })
  mode?: string;
}

export class RiskSegmentDto {
  @ApiProperty()
  from_station: string;

  @ApiProperty()
  to_station: string;

  @ApiProperty({ description: '0=free, 1=jammed' })
  congestion_level: number;

  @ApiProperty({ description: 'low | medium | high | critical' })
  risk_label: string;

  @ApiProperty({ description: '[[lat, lng], ...]' })
  coordinates: number[][];
}

export class RoutePredictionResponseDto {
  @ApiProperty()
  route_id: string;

  @ApiProperty()
  total_time_minutes: number;

  @ApiProperty()
  total_distance_km: number;

  @ApiProperty({ description: 'Estimated cost' })
  cost: string;

  @ApiProperty({ description: 'Transport mode' })
  mode: string;

  @ApiProperty({ type: [RiskSegmentDto] })
  risk_segments: RiskSegmentDto[];

  @ApiProperty({ description: 'low | medium | high | critical' })
  overall_risk: string;

  @ApiProperty({ description: 'LLM-generated explanation' })
  explanation: string;

  @ApiProperty({ description: 'Ordered station names' })
  stations: string[];

  @ApiProperty()
  departure_time: string;
}
