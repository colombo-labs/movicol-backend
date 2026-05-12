import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Max, Min } from 'class-validator';

export class PredictRequestDto {
  @IsString()
  @ApiProperty({ description: 'Station ID' })
  stationId: string;

  @IsInt()
  @Min(0)
  @Max(6)
  @ApiProperty({ description: 'Day of week (0=Monday)' })
  dayOfWeek: number;

  @IsInt()
  @Min(0)
  @Max(23)
  @ApiProperty({ description: 'Hour (0-23)' })
  hour: number;

  @IsInt()
  @ApiProperty({ description: 'Prediction horizon in minutes', default: 30 })
  horizonMinutes: number = 30;
}

export class PredictResponseDto {
  @ApiProperty()
  stationId: string;

  @ApiProperty()
  stationName: string;

  @ApiProperty({ description: '0=empty, 1=full' })
  congestionLevel: number;

  @ApiProperty({ description: 'low | medium | high | critical' })
  riskLabel: string;

  @ApiProperty()
  horizonMinutes: number;

  @ApiProperty()
  confidence: number;
}
