import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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

  @Post()
  @ApiOperation({ summary: 'Create a new insight & recommendation for this review' })
  createCriterion(
    @CurrentUser('id') adviserId: string,
    @Param('reviewId') reviewId: string,
    @Body() dto: UpdateCriterionDto,
  ) {
    return this.assessmentsService.createCriterion(adviserId, reviewId, dto);
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

  @Delete(':criterionId')
  @ApiOperation({ summary: 'Delete an insight / assessment criterion' })
  deleteCriterion(
    @CurrentUser('id') adviserId: string,
    @Param('reviewId') reviewId: string,
    @Param('criterionId') criterionId: string,
  ) {
    return this.assessmentsService.deleteCriterion(adviserId, reviewId, criterionId);
  }
}
