import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateLoanDto {
  @ApiPropertyOptional({ example: 'property-uuid' })
  @IsString()
  @IsOptional()
  propertyId?: string;

  @ApiProperty({ example: 'ANZ' })
  @IsString()
  @IsNotEmpty()
  lender: string;

  @ApiPropertyOptional({ example: 'Main Investment Facility' })
  @IsString()
  @IsOptional()
  accountName?: string;

  @ApiPropertyOptional({ example: 'ANZ1477642' })
  @IsString()
  @IsOptional()
  loanReference?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isTchLoan?: boolean;

  @ApiPropertyOptional({ example: 'Investment' })
  @IsString()
  @IsOptional()
  purpose?: string;

  @ApiPropertyOptional({ example: 'Interest only' })
  @IsString()
  @IsOptional()
  repaymentType?: string;

  @ApiPropertyOptional({ example: 'Variable' })
  @IsString()
  @IsOptional()
  rateType?: string;

  @ApiPropertyOptional({ example: 'IO', description: 'IO (Interest Only) or P&I (Principal & Interest)' })
  @IsString()
  @IsOptional()
  loanType?: string;

  @ApiPropertyOptional({ example: '24/10/2026' })
  @IsString()
  @IsOptional()
  ioExpiry?: string;

  @ApiPropertyOptional({ example: '----' })
  @IsString()
  @IsOptional()
  fixedExpiry?: string;

  @ApiPropertyOptional({ example: '24/10/2026' })
  @IsString()
  @IsOptional()
  maturityDate?: string;

  @ApiPropertyOptional({ example: '14 Bellevue Terrace, Paddington' })
  @IsString()
  @IsOptional()
  security1?: string;

  @ApiPropertyOptional({ example: '----' })
  @IsString()
  @IsOptional()
  security2?: string;

  @ApiPropertyOptional({ example: '----' })
  @IsString()
  @IsOptional()
  security3?: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isClosed?: boolean;

  @ApiPropertyOptional({ example: '' })
  @IsString()
  @IsOptional()
  closedDate?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsBoolean()
  @IsOptional()
  isOffsetAvailable?: boolean;

  @ApiPropertyOptional({ example: 650000 })
  @IsNumber()
  @IsOptional()
  loanBalance?: number;

  @ApiPropertyOptional({ example: 45000 })
  @IsNumber()
  @IsOptional()
  offsetBalance?: number;

  @ApiPropertyOptional({ example: 0.0594 })
  @IsNumber()
  @IsOptional()
  interestRate?: number;
}

export class UpdateLoanDto extends PartialType(CreateLoanDto) {}
