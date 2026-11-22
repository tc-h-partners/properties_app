import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateLoanDto {
  @ApiProperty({ example: 'Macquarie Bank' })
  @IsString()
  @IsNotEmpty()
  lender: string;

  @ApiProperty({ example: 'Main Investment Facility' })
  @IsString()
  @IsNotEmpty()
  accountName: string;

  @ApiProperty({ example: 'IO', description: 'IO (Interest Only) or P&I (Principal & Interest)' })
  @IsString()
  @IsNotEmpty()
  loanType: string;

  @ApiPropertyOptional({ example: true, default: false })
  @IsBoolean()
  @IsOptional()
  isOffsetAvailable?: boolean;
}

export class UpdateLoanDto extends PartialType(CreateLoanDto) {}
