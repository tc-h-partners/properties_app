import { ApiPropertyOptional } from '@nestjs/swagger';
import { CriterionPriority, CriterionRating } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateCriterionDto {
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
  @IsEnum(CriterionPriority)
  @IsOptional()
  priority?: CriterionPriority;

  @ApiPropertyOptional({ example: 'Client expressed preference for conservative debt levels.' })
  @IsString()
  @IsOptional()
  adviserNotes?: string;
}
