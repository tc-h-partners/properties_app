import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateBenchmarkDto {
  @ApiProperty({ example: '2025-06-30T00:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  effectiveDate: string;

  @ApiPropertyOptional({ example: 'NSW' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ example: 'Bondi' })
  @IsString()
  @IsOptional()
  suburb?: string;

  @ApiPropertyOptional({ example: 'Unit' })
  @IsString()
  @IsOptional()
  propertyCategory?: string;

  @ApiPropertyOptional({ example: 0.0595, description: 'Market benchmark interest rate (e.g. 5.95%)' })
  @IsNumber()
  @IsOptional()
  benchmarkInterestRate?: number;

  @ApiPropertyOptional({ example: 0.042, description: 'Gross rental yield benchmark (e.g. 4.2%)' })
  @IsNumber()
  @IsOptional()
  benchmarkGrossYield?: number;

  @ApiPropertyOptional({ example: 850, description: 'Median weekly rent ($)' })
  @IsNumber()
  @IsOptional()
  benchmarkWeeklyRent?: number;

  @ApiPropertyOptional({ example: 0.038, description: 'Annual rental growth benchmark' })
  @IsNumber()
  @IsOptional()
  benchmarkRentalGrowth?: number;

  @ApiPropertyOptional({ example: 0.065, description: 'Annual capital growth benchmark' })
  @IsNumber()
  @IsOptional()
  benchmarkCapitalGrowth?: number;

  @ApiPropertyOptional({ example: 20160, description: 'ASX 200 Accumulation Index value' })
  @IsNumber()
  @IsOptional()
  asxIndexValue?: number;

  @ApiPropertyOptional({ example: 'CoreLogic / SQM Research Q2 2025' })
  @IsString()
  @IsOptional()
  sourceNotes?: string;
}
