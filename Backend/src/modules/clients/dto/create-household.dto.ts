import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateHouseholdDto {
  @ApiProperty({ example: 'The Harrison Family' })
  @IsString()
  @IsNotEmpty()
  householdName: string;

  @ApiPropertyOptional({ example: 'Sarah Jenkins (Senior Property CFO)' })
  @IsString()
  @IsOptional()
  adviserAssigned?: string;

  @ApiPropertyOptional({ example: 'FY2026' })
  @IsOptional()
  initialReviewYear?: string | number;

  @ApiPropertyOptional({ example: 'john.smith@example.com' })
  @IsString()
  @IsOptional()
  primaryContactEmail?: string;

  @ApiPropertyOptional({ example: '+61 400 111 222' })
  @IsString()
  @IsOptional()
  primaryContactPhone?: string;

  @ApiPropertyOptional({ example: 'Long-term wealth building, targeting retirement at 60' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: 'Long-term wealth building, targeting retirement at 60' })
  @IsString()
  @IsOptional()
  objectives?: string;

  @ApiPropertyOptional({ example: 'Locked (Pending Review)' })
  @IsString()
  @IsOptional()
  executiveReport?: string;

  @ApiPropertyOptional({ example: 85000 })
  @IsNumber()
  @IsOptional()
  householdExpenditure?: number;

  @ApiPropertyOptional({ example: 25000 })
  @IsNumber()
  @IsOptional()
  creditCardLimit?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsNumber()
  @IsOptional()
  otherLiabilities?: number;

  @ApiPropertyOptional({ example: 4200 })
  @IsNumber()
  @IsOptional()
  monthlyPayments?: number;

  @ApiPropertyOptional({ example: 800000 })
  @IsNumber()
  @IsOptional()
  borrowingCapacity?: number;

  @ApiPropertyOptional({ example: 47000 })
  @IsNumber()
  @IsOptional()
  cashSavings?: number;
}
