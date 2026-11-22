import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AssessmentsService } from './assessments.service';
import { UpdateCriterionDto } from './dto/update-criterion.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Adviser Assessments (★ Fields)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reviews/:reviewId/assessments')
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  @Get()
  @ApiOperation({ summary: 'Fetch all AssessmentCriterion items (system evidence + ★ adviser fields)' })
  getCriteria(
    @CurrentUser('id') adviserId: string,
    @Param('reviewId') reviewId: string,
  ) {
    return this.assessmentsService.getCriteria(adviserId, reviewId);
  }

  @Patch(':criterionId')
  @ApiOperation({
    summary: 'Update ★ adviser fields (rating, insight, recommendation, priority, etc.). Locked if not IN_PROGRESS.',
  })
  updateCriterion(
    @CurrentUser('id') adviserId: string,
    @Param('reviewId') reviewId: string,
    @Param('criterionId') criterionId: string,
    @Body() dto: UpdateCriterionDto,
  ) {
    return this.assessmentsService.updateCriterion(adviserId, reviewId, criterionId, dto);
  }
}
