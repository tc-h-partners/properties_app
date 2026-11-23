import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CalculationEngineService } from '../calculation-engine/calculation-engine.service';
import { BenchmarkResolverService } from '../benchmarks/benchmark-resolver.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { BulkSavePropertySnapshotsDto } from './dto/property-snapshot.dto';
import { BulkSaveLoanSnapshotsDto } from './dto/loan-snapshot.dto';
import { WorkflowStatus, SnapshotPoint } from '@prisma/client';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calcEngine: CalculationEngineService,
    private readonly benchmarkResolver: BenchmarkResolverService,
  ) {}

  async getReviewWithAuth(adviserId: string, reviewId: string) {
    const review = await this.prisma.annualReview.findUnique({
      where: { id: reviewId },
      include: {
        household: {
          include: {
            entities: true,
            properties: {
              where: { isActive: true },
              include: { loans: { where: { isActive: true } } },
            },
          },
        },
        propertySnapshots: { include: { property: true } },
        loanSnapshots: { include: { loan: true } },
        criteria: { orderBy: { sortOrder: 'asc' } },
        futureOutlook: true,
        reportSnapshot: true,
      },
    });

    if (!review) throw new NotFoundException('Annual review not found');
    if (review.household.adviserId !== adviserId) {
      throw new ForbiddenException('Access denied: You do not manage this client household');
    }

    return review;
  }

  async updateReviewDetails(adviserId: string, reviewId: string, dto: Record<string, any>) {
    await this.getReviewWithAuth(adviserId, reviewId);
    return this.prisma.annualReview.update({
      where: { id: reviewId },
      data: {
        executiveSummary: dto.executiveSummary,
        verdictText: dto.verdictText,
        objectiveText: dto.objectiveText,
        portfolioCommentary: dto.portfolioCommentary,
        propertyCommentary: dto.propertyCommentary,
        bottomLineText: dto.bottomLineText,
        finDataStatus: dto.finDataStatus,
        tchReviewStatus: dto.tchReviewStatus,
        reviewDateStr: dto.reviewDateStr,
        shareChannel: dto.shareChannel,
        complianceAcknowledged: dto.complianceAcknowledged,
      },
    });
  }

  async createReview(adviserId: string, householdId: string, dto: CreateReviewDto) {
    const household = await this.prisma.clientHousehold.findUnique({
      where: { id: householdId },
    });
    if (!household) throw new NotFoundException('Household not found');
    if (household.adviserId !== adviserId) {
      throw new ForbiddenException('Access denied: You do not manage this client household');
    }

    const existing = await this.prisma.annualReview.findUnique({
      where: {
        householdId_financialYear: {
          householdId,
          financialYear: dto.financialYear,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Review for FY ${dto.financialYear} already exists for this household`,
      );
    }

    return this.prisma.annualReview.create({
      data: {
        householdId,
        financialYear: dto.financialYear,
        reviewDate: new Date(),
        reviewDateStr: new Date().toISOString().split('T')[0],
        executiveSummary: dto.executiveSummary,
        finDataStatus: WorkflowStatus.IN_PROGRESS,
        tchReviewStatus: WorkflowStatus.NOT_STARTED,
      },
    });
  }

  async savePropertySnapshots(
    adviserId: string,
    reviewId: string,
    dto: BulkSavePropertySnapshotsDto,
  ) {
    const review = await this.getReviewWithAuth(adviserId, reviewId);

    if (review.tchReviewStatus === WorkflowStatus.COMPLETED) {
      throw new ForbiddenException(
        'Financial snapshots are locked because the TC&H Review is completed',
      );
    }

    const results = [];
    for (const item of dto.snapshots) {
      const annualGrossRent =
        item.annualGrossRent !== undefined
          ? item.annualGrossRent
          : (item.weeklyRent || 0) * 52;

      const record = await this.prisma.propertyFinancialSnapshot.upsert({
        where: {
          annualReviewId_propertyId_snapshotPoint: {
            annualReviewId: reviewId,
            propertyId: item.propertyId,
            snapshotPoint: item.snapshotPoint,
          },
        },
        create: {
          annualReviewId: reviewId,
          propertyId: item.propertyId,
          snapshotPoint: item.snapshotPoint,
          valuation: item.valuation,
          weeklyRent: item.weeklyRent || 0,
          marketWeeklyRent: item.marketWeeklyRent || item.weeklyRent || 0,
          annualGrossRent,
          vacancyWeeks: item.vacancyWeeks || 0,
          councilRates: item.councilRates || 0,
          waterRates: item.waterRates || 0,
          insurance: item.insurance || 0,
          propertyManagementFees: item.propertyManagementFees || 0,
          repairsMaintenance: item.repairsMaintenance || 0,
          landTax: item.landTax || 0,
          strataFees: item.strataFees || 0,
          otherExpenses: item.otherExpenses || 0,
          depreciationNonCash: item.depreciationNonCash || 0,
          status: item.status || 'Completed',
          detailsJson: item.detailsJson || undefined,
        },
        update: {
          valuation: item.valuation,
          weeklyRent: item.weeklyRent || 0,
          marketWeeklyRent: item.marketWeeklyRent,
          annualGrossRent,
          vacancyWeeks: item.vacancyWeeks || 0,
          councilRates: item.councilRates || 0,
          waterRates: item.waterRates || 0,
          insurance: item.insurance || 0,
          propertyManagementFees: item.propertyManagementFees || 0,
          repairsMaintenance: item.repairsMaintenance || 0,
          landTax: item.landTax || 0,
          strataFees: item.strataFees || 0,
          otherExpenses: item.otherExpenses || 0,
          depreciationNonCash: item.depreciationNonCash || 0,
          status: item.status,
          detailsJson: item.detailsJson,
        },
      });

      // Keep property's currentValuation & weeklyRent in sync when REVIEW_DATE snapshot is updated
      if (item.snapshotPoint === SnapshotPoint.REVIEW_DATE) {
        await this.prisma.property.update({
          where: { id: item.propertyId },
          data: {
            currentValuation: item.valuation,
            weeklyRent: item.weeklyRent || 0,
          },
        });
      }

      results.push(record);
    }

    return results;
  }

  async saveLoanSnapshots(
    adviserId: string,
    reviewId: string,
    dto: BulkSaveLoanSnapshotsDto,
  ) {
    const review = await this.getReviewWithAuth(adviserId, reviewId);

    if (review.tchReviewStatus === WorkflowStatus.COMPLETED) {
      throw new ForbiddenException(
        'Financial snapshots are locked because the TC&H Review is completed',
      );
    }

    const results = [];
    for (const item of dto.snapshots) {
      const normalizedRate =
        item.interestRate > 1 ? item.interestRate / 100 : item.interestRate;
      const normalizedMarketRate =
        item.marketRate !== undefined
          ? item.marketRate > 1
            ? item.marketRate / 100
            : item.marketRate
          : undefined;

      const record = await this.prisma.loanFinancialSnapshot.upsert({
        where: {
          annualReviewId_loanId_snapshotPoint: {
            annualReviewId: reviewId,
            loanId: item.loanId,
            snapshotPoint: item.snapshotPoint,
          },
        },
        create: {
          annualReviewId: reviewId,
          loanId: item.loanId,
          snapshotPoint: item.snapshotPoint,
          loanBalance: item.loanBalance,
          offsetBalance: item.offsetBalance || 0,
          interestRate: normalizedRate,
          marketRate: normalizedMarketRate ?? 0.0605,
          annualRepayments: item.annualRepayments || 0,
          interestPaid: item.interestPaid || 0,
          loanLimit: item.loanLimit || 0,
          status: item.status || 'Completed',
        },
        update: {
          loanBalance: item.loanBalance,
          offsetBalance: item.offsetBalance || 0,
          interestRate: normalizedRate,
          marketRate: normalizedMarketRate,
          annualRepayments: item.annualRepayments || 0,
          interestPaid: item.interestPaid || 0,
          loanLimit: item.loanLimit || 0,
          status: item.status,
        },
      });
      results.push(record);
    }

    return results;
  }

  async updateFinDataStatus(
    adviserId: string,
    reviewId: string,
    status: WorkflowStatus,
  ) {
    const review = await this.getReviewWithAuth(adviserId, reviewId);

    if (review.tchReviewStatus === WorkflowStatus.COMPLETED) {
      throw new ForbiddenException(
        'Cannot alter financial status on a completed review',
      );
    }

    return this.prisma.annualReview.update({
      where: { id: reviewId },
      data: { finDataStatus: status },
    });
  }

  async startReview(adviserId: string, reviewId: string) {
    const review = await this.getReviewWithAuth(adviserId, reviewId);

    if (review.finDataStatus !== WorkflowStatus.COMPLETED) {
      throw new BadRequestException(
        'Pre-condition failed: Financial data status must be COMPLETED before starting TC&H Review.',
      );
    }

    const properties = await this.prisma.property.findMany({
      where: { householdId: review.householdId, isActive: true },
      include: {
        loans: { where: { isActive: true } },
      },
    });

    const propertySnapshots = await this.prisma.propertyFinancialSnapshot.findMany({
      where: { annualReviewId: reviewId },
    });

    const loanSnapshots = await this.prisma.loanFinancialSnapshot.findMany({
      where: { annualReviewId: reviewId },
    });

    const calculatedMetrics = [];
    for (const prop of properties) {
      const snap =
        propertySnapshots.find(
          (s) => s.propertyId === prop.id && s.snapshotPoint === SnapshotPoint.REVIEW_DATE,
        ) ||
        propertySnapshots.find(
          (s) => s.propertyId === prop.id && s.snapshotPoint === SnapshotPoint.EOFY,
        );

      if (!snap) continue;

      const propLoans = prop.loans;
      const loanSnaps = propLoans.map((l) => {
        const ls =
          loanSnapshots.find(
            (s) => s.loanId === l.id && s.snapshotPoint === snap.snapshotPoint,
          ) ||
          loanSnapshots.find((s) => s.loanId === l.id);
        return {
          id: l.id,
          loanBalance: ls ? ls.loanBalance : 0,
          offsetBalance: ls ? ls.offsetBalance : 0,
          interestRate: ls ? ls.interestRate : 0.06,
          interestPaid: ls ? ls.interestPaid : 0,
        };
      });

      const metrics = this.calcEngine.calculatePropertyMetrics({
        id: prop.id,
        name: prop.name,
        type: prop.type,
        purchaseDate: prop.purchaseDate,
        purchasePrice: prop.purchasePrice,
        acquisitionCosts: prop.acquisitionCosts,
        valuation: snap.valuation,
        weeklyRent: snap.weeklyRent,
        annualGrossRent: snap.annualGrossRent,
        vacancyWeeks: snap.vacancyWeeks,
        councilRates: snap.councilRates,
        waterRates: snap.waterRates,
        insurance: snap.insurance,
        propertyManagementFees: snap.propertyManagementFees,
        repairsMaintenance: snap.repairsMaintenance,
        landTax: snap.landTax,
        strataFees: snap.strataFees,
        otherExpenses: snap.otherExpenses,
        depreciationNonCash: snap.depreciationNonCash,
        loans: loanSnaps,
      });

      calculatedMetrics.push(metrics);
    }

    const portfolioMetrics = this.calcEngine.calculatePortfolioMetrics(calculatedMetrics);

    const resolvedBenchmark = await this.benchmarkResolver.resolveBenchmark({
      state: properties.find((p) => p.type === 'INVESTMENT')?.state || 'NSW',
      propertyCategory: properties.find((p) => p.type === 'INVESTMENT')?.propertyCategory || 'Unit',
    });

    const standardCriteria = [
      {
        category: 'CASH_MANAGEMENT',
        criterionCode: 'CM_GROSS_YIELD',
        criterionTitle: 'Gross Rental Yield Performance vs Market Benchmark',
        calculatedEvidenceJson: {
          portfolioGrossYield: portfolioMetrics.portfolioGrossYield,
          benchmarkGrossYield: resolvedBenchmark.benchmark?.benchmarkGrossYield || 0.042,
          totalAnnualGrossRent: portfolioMetrics.totalAnnualGrossRent,
          tierDescription: resolvedBenchmark.tierDescription,
        },
        sortOrder: 1,
      },
      {
        category: 'CASH_MANAGEMENT',
        criterionCode: 'CM_EXPENSE_EFFICIENCY',
        criterionTitle: 'Operating Expense Ratio & Property Management Efficiency',
        calculatedEvidenceJson: {
          portfolioOperatingExpenseRatio: portfolioMetrics.portfolioOperatingExpenseRatio,
          totalCashOperatingExpenses: portfolioMetrics.totalCashOperatingExpenses,
          totalAnnualGrossRent: portfolioMetrics.totalAnnualGrossRent,
          expenseBreakdown: portfolioMetrics.expenseBreakdown,
        },
        sortOrder: 2,
      },
      {
        category: 'CASH_MANAGEMENT',
        criterionCode: 'CM_NET_CASH_FLOW',
        criterionTitle: 'Portfolio Net Holding Cash Flow (Pre & Post Tax)',
        calculatedEvidenceJson: {
          totalPreTaxCashFlow: portfolioMetrics.totalPreTaxCashFlow,
          totalPostTaxCashFlow: portfolioMetrics.totalPostTaxCashFlow,
          totalNoi: portfolioMetrics.totalNoi,
          totalInterestPaid: portfolioMetrics.totalInterestPaid,
        },
        sortOrder: 3,
      },
      {
        category: 'CAPITAL_MANAGEMENT',
        criterionCode: 'CAP_EQUITY_LVR',
        criterionTitle: 'Portfolio LVR & Usable Equity Buffer',
        calculatedEvidenceJson: {
          totalInvestmentValuation: portfolioMetrics.totalInvestmentValuation,
          totalInvestmentNetDebt: portfolioMetrics.totalInvestmentNetDebt,
          totalInvestmentEquity: portfolioMetrics.totalInvestmentEquity,
          portfolioLvr: portfolioMetrics.portfolioLvr,
        },
        sortOrder: 4,
      },
      {
        category: 'CAPITAL_MANAGEMENT',
        criterionCode: 'CAP_CAGR_GROWTH',
        criterionTitle: 'Asset Capital Growth & Compound Annual Growth Rate (CAGR)',
        calculatedEvidenceJson: {
          portfolioCagr: portfolioMetrics.portfolioCagr,
          benchmarkCapitalGrowth: resolvedBenchmark.benchmark?.benchmarkCapitalGrowth || 0.065,
        },
        sortOrder: 5,
      },
      {
        category: 'DEBT_STRUCTURE',
        criterionCode: 'DEBT_INTEREST_RATE',
        criterionTitle: 'Weighted Average Interest Rate vs Market Benchmark Rates',
        calculatedEvidenceJson: {
          portfolioWeightedAvgInterestRate: portfolioMetrics.portfolioWeightedAvgInterestRate,
          benchmarkInterestRate: resolvedBenchmark.benchmark?.benchmarkInterestRate || 0.0595,
          totalInvestmentDebt: portfolioMetrics.totalInvestmentDebt,
          totalOffsetBalance: portfolioMetrics.totalInvestmentOffset,
        },
        sortOrder: 6,
      },
      {
        category: 'PORTFOLIO_STRATEGY',
        criterionCode: 'STRAT_RETIREMENT_OUTLOOK',
        criterionTitle: 'Long-term Household Retirement Income & Asset Trajectory',
        calculatedEvidenceJson: {
          totalInvestmentValuation: portfolioMetrics.totalInvestmentValuation,
          totalInvestmentNetDebt: portfolioMetrics.totalInvestmentNetDebt,
          investmentPropertiesCount: portfolioMetrics.investmentPropertiesCount,
          ownerOccupiedCount: portfolioMetrics.ownerOccupiedCount,
        },
        sortOrder: 7,
      },
    ];

    for (const c of standardCriteria) {
      const existing = await this.prisma.assessmentCriterion.findFirst({
        where: {
          annualReviewId: reviewId,
          criterionCode: c.criterionCode,
        },
      });

      if (existing) {
        await this.prisma.assessmentCriterion.update({
          where: { id: existing.id },
          data: {
            calculatedEvidenceJson: c.calculatedEvidenceJson,
          },
        });
      } else {
        await this.prisma.assessmentCriterion.create({
          data: {
            annualReviewId: reviewId,
            category: c.category,
            criterionCode: c.criterionCode,
            criterionTitle: c.criterionTitle,
            calculatedEvidenceJson: c.calculatedEvidenceJson,
            sortOrder: c.sortOrder,
          },
        });
      }
    }

    return this.prisma.annualReview.update({
      where: { id: reviewId },
      data: {
        tchReviewStatus: WorkflowStatus.IN_PROGRESS,
      },
      include: {
        criteria: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async completeReview(adviserId: string, reviewId: string) {
    const review = await this.getReviewWithAuth(adviserId, reviewId);

    if (review.tchReviewStatus !== WorkflowStatus.IN_PROGRESS) {
      throw new BadRequestException('Review must be IN_PROGRESS to complete.');
    }

    const unrated = review.criteria.filter((c) => !c.rating);
    if (unrated.length > 0) {
      throw new BadRequestException(
        `Please provide ratings for all assessment criteria before completing. Missing: ${unrated
          .map((c) => c.criterionTitle)
          .join(', ')}`,
      );
    }

    const completedAt = new Date();
    const reviewDate = review.reviewDate || completedAt;

    const snapshotData = {
      reviewId: review.id,
      householdId: review.householdId,
      financialYear: review.financialYear,
      reviewDate,
      completedAt,
      executiveSummary: review.executiveSummary,
      household: {
        name: review.household.householdName,
        email: review.household.primaryContactEmail,
      },
      criteria: review.criteria,
    };

    await this.prisma.reportSnapshot.upsert({
      where: { annualReviewId: reviewId },
      create: {
        annualReviewId: reviewId,
        snapshotData,
        generatedAt: completedAt,
      },
      update: {
        snapshotData,
        generatedAt: completedAt,
      },
    });

    return this.prisma.annualReview.update({
      where: { id: reviewId },
      data: {
        tchReviewStatus: WorkflowStatus.COMPLETED,
        completedAt,
        reviewDate,
      },
      include: {
        criteria: true,
        reportSnapshot: true,
      },
    });
  }

  async reopenReview(adviserId: string, reviewId: string) {
    await this.getReviewWithAuth(adviserId, reviewId);

    return this.prisma.annualReview.update({
      where: { id: reviewId },
      data: {
        tchReviewStatus: WorkflowStatus.IN_PROGRESS,
        completedAt: null,
      },
    });
  }
}
