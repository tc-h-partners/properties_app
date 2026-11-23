import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePropertyDto {
  @ApiPropertyOptional({ example: 'entity-uuid-here' })
  @IsString()
  @IsOptional()
  entityId?: string;

  @ApiPropertyOptional({ example: '48 Underwood Street, Paddington' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: '48 Underwood Street, Paddington' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiPropertyOptional({ example: 'Paddington' })
  @IsString()
  @IsOptional()
  suburb?: string;

  @ApiPropertyOptional({ example: 'NSW' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ example: '2021' })
  @IsString()
  @IsOptional()
  postcode?: string;

  @ApiPropertyOptional({ example: 'House', description: 'House, Unit, Townhouse' })
  @IsString()
  @IsOptional()
  propertyCategory?: string;

  @ApiPropertyOptional({
    example: 'INVESTMENT',
    description: 'INVESTMENT | OWNER_OCCUPIED or Investment | Owner-Occupied',
  })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ example: 'Investment' })
  @IsString()
  @IsOptional()
  purposeDisplay?: string;

  @ApiPropertyOptional({ example: '2021-03-15' })
  @IsString()
  @IsOptional()
  purchaseDate?: string;

  @ApiPropertyOptional({ example: '24/10/2026' })
  @IsString()
  @IsOptional()
  purchaseDateStr?: string;

  @ApiPropertyOptional({ example: 800000 })
  @IsNumber()
  @IsOptional()
  purchasePrice?: number;

  @ApiPropertyOptional({ example: 45936 })
  @IsNumber()
  @IsOptional()
  acquisitionCosts?: number;

  @ApiPropertyOptional({ example: 1450000 })
  @IsNumber()
  @IsOptional()
  currentValuation?: number;

  @ApiPropertyOptional({ example: 850 })
  @IsNumber()
  @IsOptional()
  weeklyRent?: number;

  @ApiPropertyOptional({ example: '600' })
  @IsString()
  @IsOptional()
  landSize?: string;

  @ApiPropertyOptional({ example: 4 })
  @IsInt()
  @IsOptional()
  beds?: number;

  @ApiPropertyOptional({ example: 3 })
  @IsInt()
  @IsOptional()
  baths?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsInt()
  @IsOptional()
  cars?: number;

  @ApiPropertyOptional({ example: 'Marcus Harrison' })
  @IsString()
  @IsOptional()
  owner1?: string;

  @ApiPropertyOptional({ example: '100%' })
  @IsString()
  @IsOptional()
  owner1Pct?: string;

  @ApiPropertyOptional({ example: '----' })
  @IsString()
  @IsOptional()
  owner2?: string;

  @ApiPropertyOptional({ example: '---' })
  @IsString()
  @IsOptional()
  owner2Pct?: string;

  @ApiPropertyOptional()
  @IsOptional()
  ownersJson?: any;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  soldDate?: string;
}

export class UpdatePropertyDto extends PartialType(CreatePropertyDto) {}
