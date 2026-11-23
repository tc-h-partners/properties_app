import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SnapshotPoint } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class LoanSnapshotItemDto {
  @ApiProperty({ example: 'loan-uuid-123' })
  @IsString()
  @IsNotEmpty()
  loanId: string;

  @ApiProperty({ enum: SnapshotPoint, example: SnapshotPoint.REVIEW_DATE })
  @IsEnum(SnapshotPoint)
  @IsNotEmpty()
  snapshotPoint: SnapshotPoint;

  @ApiProperty({ example: 620000 })
  @IsNumber()
  @IsNotEmpty()
  loanBalance: number;

  @ApiPropertyOptional({ example: 45000 })
  @IsNumber()
  @IsOptional()
  offsetBalance?: number;

  @ApiProperty({ example: 0.0595, description: 'Interest rate e.g. 0.0595 or 5.95' })
  @IsNumber()
  @IsNotEmpty()
  interestRate: number;

  @ApiPropertyOptional({ example: 0.0605 })
  @IsNumber()
  @IsOptional()
  marketRate?: number;

  @ApiPropertyOptional({ example: 36000 })
  @IsNumber()
  @IsOptional()
  annualRepayments?: number;

  @ApiPropertyOptional({ example: 34200 })
  @IsNumber()
  @IsOptional()
  interestPaid?: number;

  @ApiPropertyOptional({ example: 650000 })
  @IsNumber()
  @IsOptional()
  loanLimit?: number;

  @ApiPropertyOptional({ example: 'Completed' })
  @IsString()
  @IsOptional()
  status?: string;
}

export class BulkSaveLoanSnapshotsDto {
  @ApiProperty({ type: [LoanSnapshotItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LoanSnapshotItemDto)
  snapshots: LoanSnapshotItemDto[];
}
