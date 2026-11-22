import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CalculationEngineService } from '../calculation-engine/calculation-engine.service';
import { BenchmarkResolverService } from '../benchmarks/benchmark-resolver.service';
import { SnapshotPoint } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calcEngine: CalculationEngineService,
    private readonly benchmarkResolver: BenchmarkResolverService,
  ) {}

  private async getReviewWithContext(adviserId: string, reviewId: string) {
    const review = await this.prisma.annualReview.findUnique({
      where: { id: reviewId },
      include: {
        household: {
          include: {
            properties: {
              where: { isActive: true },
              include: {
                loans: { where: { isActive: true } },
                entity: true,
              },
            },
            reviews: {
              orderBy: { financialYear: 'asc' },
              include: {
                propertySnapshots: true,
                loanSnapshots: true,
              },
            },
          },
        },
        propertySnapshots: true,
        loanSnapshots: true,
      },
    });

    if (!review) throw new NotFoundException('Review not found');
    if (review.household.adviserId !== adviserId) {
      throw new ForbiddenException('Access denied: You do not manage this client household');
    }

    return review;
  }

  private extractMetricsForReview(
    properties: any[],
    propertySnapshots: any[],
    loanSnapshots: any[],
    preferredPoint: SnapshotPoint = SnapshotPoint.REVIEW_DATE,
  ) {
    const calculated = [];
    for (const prop of properties) {
      const snap =
        propertySnapshots.find(
          (s) => s.propertyId === prop.id && s.snapshotPoint === preferredPoint,
        ) ||
        propertySnapshots.find((s) => s.propertyId === prop.id);

      if (!snap) continue;

      const propLoans = prop.loans || [];
      const loanSnaps = propLoans.map((l: any) => {
        const ls =
          loanSnapshots.find(
            (s: any) => s.loanId === l.id && s.snapshotPoint === snap.snapshotPoint,
          ) || loanSnapshots.find((s: any) => s.loanId === l.id);
        return {
          id: l.id,
          loanBalance: ls ? ls.loanBalance : 0,
          offsetBalance: ls ? ls.offsetBalance : 0,
          interestRate: ls ? ls.interestRate : 0.0595,
          interestPaid: ls ? ls.interestPaid : 0,
          annualRepayments: ls ? ls.annualRepayments : 0,
          loanType: l.loanType,
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

      calculated.push({
        ...metrics,
        propertyDetails: {
          id: prop.id,
          name: prop.name,
          address: prop.address,
          suburb: prop.suburb,
          state: prop.state,
          postcode: prop.postcode,
          propertyCategory: prop.propertyCategory,
          type: prop.type,
          purchaseDate: prop.purchaseDate,
          purchasePrice: Number(prop.purchasePrice),
          acquisitionCosts: Number(prop.acquisitionCosts),
          entityName: prop.entity?.name || 'Individual',
        },
        rawLoans: loanSnaps,
        snapshotPoint: snap.snapshotPoint,
      });
    }

    return calculated;
  }

  // 1. Portfolio Overview (INVESTMENT-ONLY)
  async getPortfolioOverview(adviserId: string, reviewId: string) {
    const review = await this.getReviewWithContext(adviserId, reviewId);
    const properties = review.household.properties;

    const currentMetrics = this.extractMetricsForReview(
      properties,
      review.propertySnapshots,
      review.loanSnapshots,
      SnapshotPoint.REVIEW_DATE,
    );

    const portfolioSummary = this.calcEngine.calculatePortfolioMetrics(currentMetrics);

    // Build historical comparison series across all financial years for this household
    const historicalSeries = [];
    for (const pastReview of review.household.reviews) {
      const pastMetrics = this.extractMetricsForReview(
        properties,
        pastReview.propertySnapshots,
        pastReview.loanSnapshots,
        SnapshotPoint.EOFY,
      );
      const summary = this.calcEngine.calculatePortfolioMetrics(pastMetrics);
      historicalSeries.push({
        financialYear: pastReview.financialYear,
        reviewDate: pastReview.reviewDate || pastReview.createdAt,
        totalValuation: summary.totalInvestmentValuation,
        totalNetDebt: summary.totalInvestmentNetDebt,
        netEquity: summary.totalInvestmentEquity,
        portfolioLvr: summary.portfolioLvr,
        grossYield: summary.portfolioGrossYield,
        netYield: summary.portfolioNetYield,
        preTaxCashFlow: summary.totalPreTaxCashFlow,
        postTaxCashFlow: summary.totalPostTaxCashFlow,
      });
    }

    return {
      financialYear: review.financialYear,
      reviewDate: review.reviewDate || review.updatedAt,
      workflowStatus: {
        finDataStatus: review.finDataStatus,
        tchReviewStatus: review.tchReviewStatus,
      },
      portfolioSummary,
      historicalSeries,
    };
  }

  // 2. Property Analysis (BOTH Investment & Owner-Occupied with OO exclusions)
  async getPropertyAnalysis(adviserId: string, reviewId: string) {
    const review = await this.getReviewWithContext(adviserId, reviewId);
    const properties = review.household.properties;

    const metricsList = this.extractMetricsForReview(
      properties,
      review.propertySnapshots,
      review.loanSnapshots,
      SnapshotPoint.REVIEW_DATE,
    );

    // Enrich each property with resolved benchmark
    const propertiesWithBenchmarks = [];
    for (const item of metricsList) {
      const benchmark = await this.benchmarkResolver.resolveBenchmark({
        suburb: item.propertyDetails.suburb,
        state: item.propertyDetails.state,
        propertyCategory: item.propertyDetails.propertyCategory,
      });

      propertiesWithBenchmarks.push({
        ...item,
        benchmark: {
          tierMatched: benchmark.tierMatched,
          tierDescription: benchmark.tierDescription,
          grossYield: item.isOwnerOccupied ? null : benchmark.benchmark?.benchmarkGrossYield || null,
          weeklyRent: item.isOwnerOccupied ? null : benchmark.benchmark?.benchmarkWeeklyRent || null,
          interestRate: benchmark.benchmark?.benchmarkInterestRate || null,
          capitalGrowth: item.isOwnerOccupied ? null : benchmark.benchmark?.benchmarkCapitalGrowth || null,
        },
      });
    }

    return {
      financialYear: review.financialYear,
      properties: propertiesWithBenchmarks,
    };
  }

  // 3. Cash Management (Yields & Dual-axis Expense Breakdown)
  async getCashManagement(adviserId: string, reviewId: string) {
    const review = await this.getReviewWithContext(adviserId, reviewId);
    const properties = review.household.properties;

    const metricsList = this.extractMetricsForReview(
      properties,
      review.propertySnapshots,
      review.loanSnapshots,
      SnapshotPoint.REVIEW_DATE,
    );

    const investmentProperties = metricsList.filter((m) => !m.isOwnerOccupied);
    const portfolioSummary = this.calcEngine.calculatePortfolioMetrics(metricsList);

    // Property-by-property yield & cash flow comparison with benchmark
    const section1Yields = [];
    for (const inv of investmentProperties) {
      const resolved = await this.benchmarkResolver.resolveBenchmark({
        suburb: inv.propertyDetails.suburb,
        state: inv.propertyDetails.state,
        propertyCategory: inv.propertyDetails.propertyCategory,
      });

      section1Yields.push({
        propertyId: inv.propertyId,
        propertyName: inv.propertyName,
        suburb: inv.propertyDetails.suburb,
        state: inv.propertyDetails.state,
        currentValuation: inv.currentValuation,
        weeklyRent: inv.weeklyRent,
        annualGrossRent: inv.annualGrossRent,
        grossYield: inv.grossYield,
        benchmarkGrossYield: resolved.benchmark?.benchmarkGrossYield ? Number(resolved.benchmark.benchmarkGrossYield) : 0.042,
        netYield: inv.netYield,
        noi: inv.noi,
        preTaxCashFlow: inv.preTaxCashFlow,
        postTaxCashFlow: inv.postTaxCashFlow,
      });
    }

    return {
      financialYear: review.financialYear,
      section1_cashPerformance: {
        portfolioGrossYield: portfolioSummary.portfolioGrossYield,
        portfolioNetYield: portfolioSummary.portfolioNetYield,
        totalAnnualGrossRent: portfolioSummary.totalAnnualGrossRent,
        totalCashOperatingExpenses: portfolioSummary.totalCashOperatingExpenses,
        totalPreTaxCashFlow: portfolioSummary.totalPreTaxCashFlow,
        totalPostTaxCashFlow: portfolioSummary.totalPostTaxCashFlow,
        propertyYields: section1Yields,
      },
      section2_expenseEfficiency: {
        portfolioOperatingExpenseRatio: portfolioSummary.portfolioOperatingExpenseRatio,
        expenseBreakdownDualAxis: portfolioSummary.expenseBreakdown,
        propertyExpenseBreakdowns: investmentProperties.map((inv) => ({
          propertyId: inv.propertyId,
          propertyName: inv.propertyName,
          operatingExpenseRatio: inv.operatingExpenseRatio,
          breakdown: inv.expenseBreakdown,
        })),
      },
    };
  }

  // 4. Capital Management (Asset Growth & Debt Structure)
  async getCapitalManagement(adviserId: string, reviewId: string) {
    const review = await this.getReviewWithContext(adviserId, reviewId);
    const properties = review.household.properties;

    const metricsList = this.extractMetricsForReview(
      properties,
      review.propertySnapshots,
      review.loanSnapshots,
      SnapshotPoint.REVIEW_DATE,
    );

    // Historical EOFY valuations
    const eofySnapshots = review.propertySnapshots.filter(
      (s) => s.snapshotPoint === SnapshotPoint.EOFY,
    );

    const assetPerformance = [];
    for (const prop of metricsList) {
      const eofySnap = eofySnapshots.find((s) => s.propertyId === prop.propertyId);
      const benchmark = await this.benchmarkResolver.resolveBenchmark({
        suburb: prop.propertyDetails.suburb,
        state: prop.propertyDetails.state,
        propertyCategory: prop.propertyDetails.propertyCategory,
      });

      assetPerformance.push({
        propertyId: prop.propertyId,
        propertyName: prop.propertyName,
        propertyType: prop.propertyType,
        isOwnerOccupied: prop.isOwnerOccupied,
        purchasePrice: prop.propertyDetails.purchasePrice,
        totalPurchaseCost: prop.totalPurchaseCost,
        eofyValuation: eofySnap ? Number(eofySnap.valuation) : null,
        reviewDateValuation: prop.currentValuation,
        capitalGrowthDollar: prop.capitalGrowthDollar,
        capitalGrowthPercentage: prop.capitalGrowthPercentage,
        cagr: prop.cagr,
        benchmarkCapitalGrowth: prop.isOwnerOccupied ? null : benchmark.benchmark?.benchmarkCapitalGrowth ? Number(benchmark.benchmark.benchmarkCapitalGrowth) : 0.065,
      });
    }

    // Debt Structure
    let totalIoDebt = 0;
    let totalPiDebt = 0;
    const loanFacilities = [];

    for (const prop of metricsList) {
      for (const loan of prop.rawLoans) {
        const isIo = (loan.loanType || '').toUpperCase().includes('IO');
        if (isIo) totalIoDebt += Number(loan.loanBalance);
        else totalPiDebt += Number(loan.loanBalance);

        loanFacilities.push({
          loanId: loan.id,
          propertyId: prop.propertyId,
          propertyName: prop.propertyName,
          accountName: loan.accountName,
          loanType: loan.loanType,
          loanBalance: Number(loan.loanBalance),
          offsetBalance: Number(loan.offsetBalance),
          netDebt: Math.max(0, Number(loan.loanBalance) - Number(loan.offsetBalance)),
          interestRate: Number(loan.interestRate),
          annualInterestCost: Number(loan.interestPaid || Number(loan.loanBalance) * Number(loan.interestRate)),
        });
      }
    }

    const portfolioSummary = this.calcEngine.calculatePortfolioMetrics(metricsList);
    const benchmarkRate = (await this.benchmarkResolver.resolveBenchmark({})).benchmark?.benchmarkInterestRate;

    return {
      financialYear: review.financialYear,
      section1_assetPerformance: {
        portfolioCagr: portfolioSummary.portfolioCagr,
        properties: assetPerformance,
      },
      section2_debtManagement: {
        totalDebt: portfolioSummary.totalInvestmentDebt,
        totalOffset: portfolioSummary.totalInvestmentOffset,
        totalNetDebt: portfolioSummary.totalInvestmentNetDebt,
        portfolioLvr: portfolioSummary.portfolioLvr,
        weightedAvgInterestRate: portfolioSummary.portfolioWeightedAvgInterestRate,
        marketBenchmarkRate: benchmarkRate ? Number(benchmarkRate) : 0.0595,
        debtStructureSplit: {
          interestOnlyAmount: totalIoDebt,
          principalAndInterestAmount: totalPiDebt,
          interestOnlyRatio: totalIoDebt + totalPiDebt > 0 ? totalIoDebt / (totalIoDebt + totalPiDebt) : 0,
        },
        facilities: loanFacilities,
      },
    };
  }
}
