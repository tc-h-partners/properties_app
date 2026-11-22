import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { FutureOutlookService } from '../future-outlook/future-outlook.service';
import { WorkflowStatus } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analyticsService: AnalyticsService,
    private readonly futureOutlookService: FutureOutlookService,
  ) {}

  async generateReport(adviserId: string, reviewId: string) {
    const review = await this.prisma.annualReview.findUnique({
      where: { id: reviewId },
      include: {
        household: {
          include: {
            members: true,
            adviser: {
              select: {
                id: true,
                fullName: true,
                email: true,
                firmName: true,
              },
            },
          },
        },
        criteria: { orderBy: { sortOrder: 'asc' } },
        reportSnapshot: true,
      },
    });

    if (!review) throw new NotFoundException('Annual review not found');
    if (review.household.adviserId !== adviserId) {
      throw new ForbiddenException('Access denied: You do not manage this client household');
    }

    // MANDATORY PRODUCT LOCK:
    // "Report cannot be viewed until TC&H Review is completed."
    if (review.tchReviewStatus !== WorkflowStatus.COMPLETED) {
      throw new ForbiddenException(
        'Report cannot be viewed until TC&H Review is completed.',
      );
    }

    // If a frozen snapshot exists and contains everything, return it, or compile live consolidated report
    const [portfolioOverview, propertyAnalysis, cashManagement, capitalManagement, futureOutlook] =
      await Promise.all([
        this.analyticsService.getPortfolioOverview(adviserId, reviewId),
        this.analyticsService.getPropertyAnalysis(adviserId, reviewId),
        this.analyticsService.getCashManagement(adviserId, reviewId),
        this.analyticsService.getCapitalManagement(adviserId, reviewId),
        this.futureOutlookService.getScenario(adviserId, reviewId),
      ]);

    return {
      reportMetadata: {
        reviewId: review.id,
        financialYear: review.financialYear,
        reviewDate: review.reviewDate || review.completedAt,
        completedAt: review.completedAt,
        isCompleted: true,
        generatedAt: new Date(),
      },
      adviser: review.household.adviser,
      household: {
        id: review.household.id,
        householdName: review.household.householdName,
        primaryContactEmail: review.household.primaryContactEmail,
        primaryContactPhone: review.household.primaryContactPhone,
        members: review.household.members,
      },
      executiveSummary: review.executiveSummary || 'Annual Strategic Wealth & Property Portfolio Review.',
      assessments: review.criteria,
      portfolioOverview: portfolioOverview.portfolioSummary,
      historicalComparison: portfolioOverview.historicalSeries,
      propertyAnalysis: propertyAnalysis.properties,
      cashManagement,
      capitalManagement,
      futureOutlook: {
        heroOutputs: futureOutlook.heroOutputs,
        levers: futureOutlook.levers,
        projections: futureOutlook.yearByYearProjections,
      },
      disclaimers: {
        generalAdviceWarning:
          'This document has been prepared for general information purposes only and does not constitute personal financial, tax, or legal advice. Prior to acting on any information, you must consider its appropriateness with regard to your individual financial objectives and consult a licensed adviser.',
        modelLimitations:
          'Projections and calculations are illustrative and rely upon historical figures, market benchmarks, and adviser-entered assumptions. Future market performance, taxation policies, and interest rates may vary significantly.',
      },
    };
  }
}
