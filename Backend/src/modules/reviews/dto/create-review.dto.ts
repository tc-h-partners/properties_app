import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ example: 2026, description: 'Financial year (e.g. 2026)' })
  @IsInt()
  @Min(2000)
  @Max(2100)
  @IsNotEmpty()
  financialYear: number;

  @ApiPropertyOptional({ example: 'Annual portfolio performance review and retirement readiness assessment.' })
  @IsString()
  @IsOptional()
  executiveSummary?: string;
}
