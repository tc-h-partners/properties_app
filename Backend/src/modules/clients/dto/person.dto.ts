import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePersonDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Smith' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiPropertyOptional({ example: '1982-05-14T00:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  dob?: string;

  @ApiPropertyOptional({ example: 60 })
  @IsNumber()
  @IsOptional()
  expectedRetirementAge?: number;

  @ApiPropertyOptional({ example: 350000 })
  @IsNumber()
  @IsOptional()
  currentSuperBalance?: number;

  @ApiPropertyOptional({ example: 27500 })
  @IsNumber()
  @IsOptional()
  annualSuperContribution?: number;

  @ApiPropertyOptional({ example: 0.37, description: 'Marginal tax rate (e.g. 0.37)' })
  @IsNumber()
  @IsOptional()
  marginalTaxRate?: number;
}

export class UpdatePersonDto extends PartialType(CreatePersonDto) {}
