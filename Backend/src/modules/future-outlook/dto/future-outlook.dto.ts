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

  @ApiPropertyOptional({ example: 0.035, description: 'Investment property net yield (e.g. 0.035 for 3.5%)' })
  @IsNumber()
  @IsOptional()
  netYield?: number;

  @ApiPropertyOptional({ example: 0.03, description: 'Annual forecast CPI inflation rate (e.g. 0.03 for 3.0%)' })
  @IsNumber()
  @IsOptional()
  forecastCpi?: number;

  @ApiPropertyOptional({ example: 0.30, description: 'Capital Gains Tax (CGT) rate (e.g. 0.30 for 30%)' })
  @IsNumber()
  @IsOptional()
  cgtTaxRate?: number;

  @ApiPropertyOptional({ example: '1/7/2027', description: 'Tax Reform Effective Date' })
  @IsOptional()
  taxReformDate?: string;

  @ApiPropertyOptional({ example: 0.05, description: 'Global investment return assumption (e.g. 0.05 for 5.0% p.a.)' })
  @IsNumber()
  @IsOptional()
  investmentReturn?: number;

  @ApiPropertyOptional({ example: 0.30, description: 'Global income tax assumption (e.g. 0.30 for 30%)' })
  @IsNumber()
  @IsOptional()
  incomeTaxRate?: number;

  @ApiPropertyOptional({ example: 1500000, description: 'Today estimated purchase price of downsized replacement home ($)' })
  @IsNumber()
  @IsOptional()
  downsizeHomePriceToday?: number;
}
