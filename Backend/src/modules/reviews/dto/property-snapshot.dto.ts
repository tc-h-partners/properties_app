import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SnapshotPoint } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class PropertySnapshotItemDto {
  @ApiProperty({ example: 'property-uuid-123' })
  @IsString()
  @IsNotEmpty()
  propertyId: string;

  @ApiProperty({ enum: SnapshotPoint, example: SnapshotPoint.REVIEW_DATE })
  @IsEnum(SnapshotPoint)
  @IsNotEmpty()
  snapshotPoint: SnapshotPoint;

  @ApiProperty({ example: 950000 })
  @IsNumber()
  @IsNotEmpty()
  valuation: number;

  @ApiPropertyOptional({ example: 750 })
  @IsNumber()
  @IsOptional()
  weeklyRent?: number;

  @ApiPropertyOptional({ example: 840 })
  @IsNumber()
  @IsOptional()
  marketWeeklyRent?: number;

  @ApiPropertyOptional({ example: 39000 })
  @IsNumber()
  @IsOptional()
  annualGrossRent?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsNumber()
  @IsOptional()
  vacancyWeeks?: number;

  @ApiPropertyOptional({ example: 1800 })
  @IsNumber()
  @IsOptional()
  councilRates?: number;

  @ApiPropertyOptional({ example: 950 })
  @IsNumber()
  @IsOptional()
  waterRates?: number;

  @ApiPropertyOptional({ example: 1400 })
  @IsNumber()
  @IsOptional()
  insurance?: number;

  @ApiPropertyOptional({ example: 2500 })
  @IsNumber()
  @IsOptional()
  propertyManagementFees?: number;

  @ApiPropertyOptional({ example: 1200 })
  @IsNumber()
  @IsOptional()
  repairsMaintenance?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsNumber()
  @IsOptional()
  landTax?: number;

  @ApiPropertyOptional({ example: 3200 })
  @IsNumber()
  @IsOptional()
  strataFees?: number;

  @ApiPropertyOptional({ example: 500 })
  @IsNumber()
  @IsOptional()
  otherExpenses?: number;

  @ApiPropertyOptional({ example: 6500, description: 'Non-cash division 40 / 43 depreciation' })
  @IsNumber()
  @IsOptional()
  depreciationNonCash?: number;

  @ApiPropertyOptional({ example: 'Completed' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  detailsJson?: any;
}

export class BulkSavePropertySnapshotsDto {
  @ApiProperty({ type: [PropertySnapshotItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PropertySnapshotItemDto)
  snapshots: PropertySnapshotItemDto[];
}
