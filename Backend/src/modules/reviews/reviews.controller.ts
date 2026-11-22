import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { BulkSavePropertySnapshotsDto } from './dto/property-snapshot.dto';
import { BulkSaveLoanSnapshotsDto } from './dto/loan-snapshot.dto';
import { UpdateFinDataStatusDto } from './dto/update-fin-data-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Reviews & Financial Snapshots')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('clients/:clientId/reviews')
  @ApiOperation({ summary: 'Create an Annual Review for a client household & financial year' })
  createReview(
    @CurrentUser('id') adviserId: string,
    @Param('clientId') clientId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.createReview(adviserId, clientId, dto);
  }

  @Get('reviews/:reviewId')
  @ApiOperation({ summary: 'Get details and state of an annual review' })
  getReview(
    @CurrentUser('id') adviserId: string,
    @Param('reviewId') reviewId: string,
  ) {
    return this.reviewsService.getReviewWithAuth(adviserId, reviewId);
  }

  @Put('reviews/:reviewId/financials/properties')
  @ApiOperation({ summary: 'Save/upsert property financial snapshots (EOFY or REVIEW_DATE)' })
  savePropertySnapshots(
    @CurrentUser('id') adviserId: string,
    @Param('reviewId') reviewId: string,
    @Body() dto: BulkSavePropertySnapshotsDto,
  ) {
    return this.reviewsService.savePropertySnapshots(adviserId, reviewId, dto);
  }

  @Put('reviews/:reviewId/financials/loans')
  @ApiOperation({ summary: 'Save/upsert loan financial snapshots (EOFY or REVIEW_DATE)' })
  saveLoanSnapshots(
    @CurrentUser('id') adviserId: string,
    @Param('reviewId') reviewId: string,
    @Body() dto: BulkSaveLoanSnapshotsDto,
  ) {
    return this.reviewsService.saveLoanSnapshots(adviserId, reviewId, dto);
  }

  @Patch('reviews/:reviewId/fin-data-status')
  @ApiOperation({ summary: 'Toggle financial data collection status (IN_PROGRESS <-> COMPLETED)' })
  updateFinDataStatus(
    @CurrentUser('id') adviserId: string,
    @Param('reviewId') reviewId: string,
    @Body() dto: UpdateFinDataStatusDto,
  ) {
    return this.reviewsService.updateFinDataStatus(adviserId, reviewId, dto.status);
  }

  @Post('reviews/:reviewId/start-review')
  @ApiOperation({
    summary:
      'Start TC&H Review: Transitions status to IN_PROGRESS, computes metrics, and seeds assessment criteria',
  })
  startReview(
    @CurrentUser('id') adviserId: string,
    @Param('reviewId') reviewId: string,
  ) {
    return this.reviewsService.startReview(adviserId, reviewId);
  }

  @Post('reviews/:reviewId/complete-review')
  @ApiOperation({
    summary:
      'Complete TC&H Review: Validates ★ criteria, stamps completion date, locks snapshots, and creates report snapshot',
  })
  completeReview(
    @CurrentUser('id') adviserId: string,
    @Param('reviewId') reviewId: string,
  ) {
    return this.reviewsService.completeReview(adviserId, reviewId);
  }

  @Post('reviews/:reviewId/reopen-review')
  @ApiOperation({ summary: 'Re-open a completed review for corrections' })
  reopenReview(
    @CurrentUser('id') adviserId: string,
    @Param('reviewId') reviewId: string,
  ) {
    return this.reviewsService.reopenReview(adviserId, reviewId);
  }
}
