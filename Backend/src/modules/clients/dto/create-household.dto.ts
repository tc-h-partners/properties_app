import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateHouseholdDto {
  @ApiProperty({ example: 'Smith Family' })
  @IsString()
  @IsNotEmpty()
  householdName: string;

  @ApiProperty({ example: 'john.smith@example.com' })
  @IsEmail()
  @IsNotEmpty()
  primaryContactEmail: string;

  @ApiPropertyOptional({ example: '+61 400 111 222' })
  @IsString()
  @IsOptional()
  primaryContactPhone?: string;

  @ApiPropertyOptional({ example: 'Long-term wealth building, targeting retirement at 60' })
  @IsString()
  @IsOptional()
  notes?: string;
}
