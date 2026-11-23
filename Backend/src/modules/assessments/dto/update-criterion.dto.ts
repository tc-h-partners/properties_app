import { ApiPropertyOptional } from '@nestjs/swagger';
import { CriterionPriority, CriterionRating } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateCriterionDto {
  @ApiPropertyOptional({ example: 'Rental Income Review' })
  @IsString()
  @IsOptional()
  criterionTitle?: string;

  @ApiPropertyOptional({ example: 'Property Analysis' })
  @IsString()
  @IsOptional()
  screen?: string;

  @ApiPropertyOptional({ example: '7 Kawana Way, Buddina' })
  @IsString()
  @IsOptional()
  propertyName?: string;

  @ApiPropertyOptional({ example: 'Rent 11% below benchmark' })
  @IsString()
  @IsOptional()
  maintenanceInsight?: string;

  @ApiPropertyOptional({ example: 'Rental Income' })
  @IsString()
  @IsOptional()
  metric?: string;

  @ApiPropertyOptional({ example: 'Adviser' })
  @IsString()
  @IsOptional()
  owner?: string;

  @ApiPropertyOptional({ example: 'Reset rent Q3' })
  @IsString()
  @IsOptional()
  action?: string;

  @ApiPropertyOptional({
    enum: CriterionRating,
    example: CriterionRating.STRONG,
    description: 'STRONG | SATISFACTORY | ATTENTION_REQUIRED | CRITICAL',
  })
  @IsEnum(CriterionRating)
  @IsOptional()
  rating?: CriterionRating;

  @ApiPropertyOptional({ example: 'Yield remains robust at 4.8%, outperforming market benchmark by 60bps.' })
  @IsString()
  @IsOptional()
  insight?: string;

  @ApiPropertyOptional({ example: 'Maintain existing fixed loan structure; consider market rent review at next lease rollover.' })
  @IsString()
  @IsOptional()
  recommendation?: string;

  @ApiPropertyOptional({ example: 'Potential equity extraction of $80k for deposit on next investment asset.' })
  @IsString()
  @IsOptional()
  potentialOpportunity?: string;

  @ApiPropertyOptional({
    enum: CriterionPriority,
    example: CriterionPriority.HIGH,
    description: 'HIGH | MEDIUM | LOW | MONITOR',
  })
  @IsOptional()
  priority?: CriterionPriority | string;

  @ApiPropertyOptional({ example: 'Client expressed preference for conservative debt levels.' })
  @IsString()
  @IsOptional()
  adviserNotes?: string;
}
