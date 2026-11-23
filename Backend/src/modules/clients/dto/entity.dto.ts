import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateEntityDto {
  @ApiProperty({ example: 'Harrison Family Trust' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'FAMILY_TRUST',
    description: 'INDIVIDUAL | JOINT | FAMILY_TRUST | UNIT_TRUST | COMPANY | SMSF or display label',
  })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ example: 'Discretionary Trust' })
  @IsString()
  @IsOptional()
  displayType?: string;

  @ApiPropertyOptional({ example: '64 901 823 441' })
  @IsString()
  @IsOptional()
  abnOrTfnMasked?: string;

  @ApiPropertyOptional({ example: '32' })
  @IsString()
  @IsOptional()
  ageOrDob?: string;

  @ApiPropertyOptional({ example: '+61 412 890 231' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'ethan.h@student.edu.au' })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 210000 })
  @IsNumber()
  @IsOptional()
  annualSalary?: number;

  @ApiPropertyOptional({ example: 0.45 })
  @IsNumber()
  @IsOptional()
  marginalTaxRate?: number;

  @ApiPropertyOptional({ example: 385000 })
  @IsNumber()
  @IsOptional()
  superBalance?: number;
}

export class UpdateEntityDto extends PartialType(CreateEntityDto) {}
