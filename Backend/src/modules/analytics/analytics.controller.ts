import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Analytics & Reporting Dashboards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reviews/:reviewId/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('portfolio-overview')
  @ApiOperation({
    summary:
      'Aggregated Investment-Only portfolio KPIs (excludes Owner-Occupied) + historical comparison series',
  })
  getPortfolioOverview(
    @CurrentUser('id') adviserId: string,
    @Param('reviewId') reviewId: string,
  ) {
    return this.analyticsService.getPortfolioOverview(adviserId, reviewId);
  }

  @Get('property-analysis')
  @ApiOperation({
    summary:
      'Property analysis cards for BOTH Investment and Owner-Occupied properties (OO clearly flagged with nulls for yield/cashflow)',
  })
  getPropertyAnalysis(
    @CurrentUser('id') adviserId: string,
    @Param('reviewId') reviewId: string,
  ) {
    return this.analyticsService.getPropertyAnalysis(adviserId, reviewId);
  }

  @Get('cash-management')
  @ApiOperation({
    summary:
      'Section 1: Rental Yields & Cash Flows vs Benchmarks; Section 2: Dual-axis operating expenses ($ and % of rent)',
  })
  getCashManagement(
    @CurrentUser('id') adviserId: string,
    @Param('reviewId') reviewId: string,
  ) {
    return this.analyticsService.getCashManagement(adviserId, reviewId);
  }

  @Get('capital-management')
  @ApiOperation({
    summary:
      'Section 1: Asset Valuations, Capital Growth & CAGR vs Benchmarks; Section 2: Debt balances, LVR, and IO vs P&I split',
  })
  getCapitalManagement(
    @CurrentUser('id') adviserId: string,
    @Param('reviewId') reviewId: string,
  ) {
    return this.analyticsService.getCapitalManagement(adviserId, reviewId);
  }
}
