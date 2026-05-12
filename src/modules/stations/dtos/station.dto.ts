import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class StationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  lat: number;

  @ApiProperty()
  lon: number;

  @ApiPropertyOptional()
  route?: string;

  @ApiPropertyOptional()
  zone?: string;

  @ApiProperty()
  degree: number;
}

export class CreateStationDto {
  @IsString()
  @ApiProperty()
  name: string;

  @IsNumber()
  @ApiProperty()
  lat: number;

  @IsNumber()
  @ApiProperty()
  lon: number;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  route?: string;

  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  zone?: string;
}
