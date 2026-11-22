import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { PropertyType } from '@prisma/client';
import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePropertyDto {
  @ApiPropertyOptional({ example: 'entity-uuid-here' })
  @IsString()
  @IsOptional()
  entityId?: string;

  @ApiProperty({ example: '24 Ocean Street' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '24 Ocean Street' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: 'Bondi' })
  @IsString()
  @IsNotEmpty()
  suburb: string;

  @ApiProperty({ example: 'NSW' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ example: '2026' })
  @IsString()
  @IsNotEmpty()
  postcode: string;

  @ApiProperty({ example: 'Unit', description: 'House, Unit, Townhouse' })
  @IsString()
  @IsNotEmpty()
  propertyCategory: string;

  @ApiProperty({
    enum: PropertyType,
    example: PropertyType.INVESTMENT,
    description: 'INVESTMENT | OWNER_OCCUPIED',
  })
  @IsEnum(PropertyType)
  @IsNotEmpty()
  type: PropertyType;

  @ApiProperty({ example: '2021-03-15T00:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  purchaseDate: string;

  @ApiProperty({ example: 850000 })
  @IsNumber()
  @IsNotEmpty()
  purchasePrice: number;

  @ApiPropertyOptional({ example: 38000, description: 'Stamp duty, legal fees, inspection costs' })
  @IsNumber()
  @IsOptional()
  acquisitionCosts?: number;
}

export class UpdatePropertyDto extends PartialType(CreatePropertyDto) {}
