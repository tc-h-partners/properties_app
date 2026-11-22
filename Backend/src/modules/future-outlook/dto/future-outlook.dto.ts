import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class FutureOutlookLeversDto {
  @ApiPropertyOptional({ example: 15, default: 15 })
  @IsInt()
  @Min(1)
  @Max(40)
  @IsOptional()
  forecastYears?: number;

  @ApiPropertyOptional({ example: 0.05, description: 'Annual property capital growth rate (e.g. 0.05 for 5%)' })
  @IsNumber()
  @IsOptional()
  propertyGrowthRate?: number;

  @ApiPropertyOptional({ example: 0.035, description: 'Annual rental growth rate (e.g. 0.035 for 3.5%)' })
  @IsNumber()
  @IsOptional()
  rentalGrowthRate?: number;

  @ApiPropertyOptional({ example: 0.025, description: 'Annual inflation rate (e.g. 0.025 for 2.5%)' })
  @IsNumber()
  @IsOptional()
  inflationRate?: number;

  @ApiPropertyOptional({ example: 0.07, description: 'Annual superannuation investment return rate (e.g. 0.07 for 7%)' })
  @IsNumber()
  @IsOptional()
  superReturnRate?: number;

  @ApiPropertyOptional({ example: 1000, description: 'Additional monthly principal repayment on home loan ($)' })
  @IsNumber()
  @IsOptional()
  extraMonthlyHomeLoanRepayment?: number;

  @ApiPropertyOptional({ example: true, description: 'Enable future home downsizing scenario' })
  @IsBoolean()
  @IsOptional()
  downsizeEnabled?: boolean;

  @ApiPropertyOptional({ example: 10, description: 'Year offset at which downsizing occurs' })
  @IsInt()
  @IsOptional()
  downsizeYearOffset?: number;

  @ApiPropertyOptional({ example: 450000, description: 'Net capital proceeds injected into super from downsizing' })
  @IsNumber()
  @IsOptional()
  downsizeNetProceedsToSuper?: number;

  @ApiPropertyOptional({ example: 150000, description: 'Target annual household after-tax income in retirement ($)' })
  @IsNumber()
  @IsOptional()
  targetRetirementIncomeAfterTax?: number;
}
