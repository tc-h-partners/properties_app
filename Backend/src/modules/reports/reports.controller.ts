import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Annual Review Report')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reviews/:reviewId/report')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @ApiOperation({
    summary:
      'Consolidated Annual Review Report (Throws 403 Forbidden if tchReviewStatus !== COMPLETED)',
  })
  getReport(
    @CurrentUser('id') adviserId: string,
    @Param('reviewId') reviewId: string,
  ) {
    return this.reportsService.generateReport(adviserId, reviewId);
  }
}
