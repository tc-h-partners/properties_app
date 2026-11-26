import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FutureOutlookLeversDto } from './dto/future-outlook.dto';
import Decimal from 'decimal.js';

@Injectable()
export class FutureOutlookService {
  constructor(private readonly prisma: PrismaService) {}

  private async getReviewWithHousehold(adviserId: string, reviewId: string) {
    const review = await this.prisma.annualReview.findUnique({
      where: { id: reviewId },
      include: {
        household: {
          include: {
            members: true,
            properties: {
              where: { isActive: true },
              include: { loans: { where: { isActive: true } } },
            },
          },
        },
        propertySnapshots: true,
        loanSnapshots: true,
        futureOutlook: true,
      },
    });

    if (!review) throw new NotFoundException('Review not found');
    if (review.household.adviserId !== adviserId) {
      throw new ForbiddenException('Access denied: You do not manage this client household');
    }

    return review;
  }

  calculateProjections(baselineData: any, levers: FutureOutlookLeversDto) {
    const forecastYears = levers.forecastYears || 15;
    const propGrowth = levers.propertyGrowthRate !== undefined ? levers.propertyGrowthRate : 0.05;
    const rentGrowth = levers.rentalGrowthRate !== undefined ? levers.rentalGrowthRate : 0.035;
    const superReturn = levers.superReturnRate !== undefined ? levers.superReturnRate : 0.07;
    const extraMonthlyHomeLoan = levers.extraMonthlyHomeLoanRepayment || 0;
    const downsizeEnabled = levers.downsizeEnabled || false;
    const downsizeYear = levers.downsizeYearOffset || 10;
    let downsizeProceeds = levers.downsizeNetProceedsToSuper || 0;
    const targetIncome = levers.targetRetirementIncomeAfterTax || 140000;

    // Global Assumptions & Enhanced Levers
    const baselineNetYield = baselineData.baselineNetYield || 0.035;
    const netYield = levers.netYield !== undefined ? levers.netYield : baselineNetYield;
    const forecastCpi = levers.forecastCpi !== undefined ? levers.forecastCpi : 0.030;
    const cgtTaxRate = levers.cgtTaxRate !== undefined ? levers.cgtTaxRate : 0.30;
    const investmentReturn = levers.investmentReturn !== undefined ? levers.investmentReturn : 0.05;
    const incomeTaxRate = levers.incomeTaxRate !== undefined ? levers.incomeTaxRate : 0.30;
    const downsizeHomePriceToday = levers.downsizeHomePriceToday || 0;
    const adultCount = baselineData.adultCount || 2;

    // Baselines at Year 0
    let ooValuation = new Decimal(baselineData.ooValuation || 0);
    let ooDebt = new Decimal(baselineData.ooDebt || 0);
    let invValuation = new Decimal(baselineData.invValuation || 0);
    let invDebt = new Decimal(baselineData.invDebt || 0);
    let invGrossRent = new Decimal(baselineData.invGrossRent || 0);
    let superBalance = new Decimal(baselineData.superBalance || 0);
    const annualSuperContrib = new Decimal(baselineData.annualSuperContrib || 0);
    const avgInterestRate = new Decimal(baselineData.avgInterestRate || 0.0595);

    let downsizeReleasedCapital = 0;
    let downsizeToSuper = 0;
    let downsizeToInvestedCapital = 0;

    const yearByYear = [];

    // Year 0
    yearByYear.push({
      year: 0,
      calendarYear: new Date().getFullYear(),
      ownerOccupiedValuation: ooValuation.toNumber(),
      ownerOccupiedDebt: ooDebt.toNumber(),
      investmentValuation: invValuation.toNumber(),
      investmentDebt: invDebt.toNumber(),
      totalPropertyValuation: ooValuation.plus(invValuation).toNumber(),
      totalDebt: ooDebt.plus(invDebt).toNumber(),
      netEquity: ooValuation.plus(invValuation).minus(ooDebt.plus(invDebt)).toNumber(),
      superBalance: superBalance.toNumber(),
      totalNetAssets: ooValuation.plus(invValuation).minus(ooDebt.plus(invDebt)).plus(superBalance).toNumber(),
      annualGrossRent: invGrossRent.toNumber(),
      netRentalCashFlow: invGrossRent.times(0.65).minus(invDebt.times(avgInterestRate)).toNumber(),
      event: 'Baseline Year 0',
    });

    for (let yr = 1; yr <= forecastYears; yr++) {
      let event = '';

      // Compounding property values and rents
      ooValuation = ooValuation.times(1 + propGrowth);
      invValuation = invValuation.times(1 + propGrowth);
      invGrossRent = invGrossRent.times(1 + rentGrowth);

      // Principal reduction on Home Loan
      const annualExtraHomeLoanRepayment = new Decimal(extraMonthlyHomeLoan).times(12);
      ooDebt = Decimal.max(0, ooDebt.minus(annualExtraHomeLoanRepayment));

      // Net Yield improved cash flow into investment debt reduction
      const yieldSurplus = Math.max(0, netYield - baselineNetYield);
      const extraAnnualCashFromYield = invValuation.times(yieldSurplus);
      invDebt = Decimal.max(0, invDebt.minus(extraAnnualCashFromYield));

      // Superannuation growth + contributions
      superBalance = superBalance.times(1 + superReturn).plus(annualSuperContrib);

      // Downsizing event check
      if (downsizeEnabled && yr === downsizeYear) {
        if (downsizeHomePriceToday > 0) {
          const replacementHomeCost = downsizeHomePriceToday * Math.pow(1 + propGrowth, yr);
          const rawEquity = ooValuation.minus(ooDebt).toNumber();
          downsizeReleasedCapital = Math.max(0, rawEquity - replacementHomeCost);
          const maxSuperDownsize = 300000 * adultCount;
          downsizeToSuper = Math.min(downsizeReleasedCapital, maxSuperDownsize);
          downsizeToInvestedCapital = Math.max(0, downsizeReleasedCapital - downsizeToSuper);
          downsizeProceeds = downsizeToSuper;

          ooValuation = new Decimal(Math.round(replacementHomeCost));
          ooDebt = new Decimal(0);
          superBalance = superBalance.plus(downsizeToSuper);

          event = `Downsizing Event: Purchased replacement home ($${Math.round(replacementHomeCost).toLocaleString()}); cleared OO debt; injected $${Math.round(downsizeToSuper).toLocaleString()} to Super and $${Math.round(downsizeToInvestedCapital).toLocaleString()} to Invested Capital.`;
        } else {
          event = `Home Downsizing Event: Injected $${downsizeProceeds.toLocaleString()} to Super; OO Debt Cleared.`;
          superBalance = superBalance.plus(downsizeProceeds);
          ooDebt = new Decimal(0);
          ooValuation = ooValuation.times(0.6);
        }
      }

      const totalPropVal = ooValuation.plus(invValuation);
      const totalDebtVal = ooDebt.plus(invDebt);
      const netEquityVal = totalPropVal.minus(totalDebtVal);
      const totalNetAssetsVal = netEquityVal.plus(superBalance);

      // Approx Net Cash flow from properties (NOI ~65% of rent minus interest)
      const approxNoi = invGrossRent.times(0.65);
      const approxInterest = invDebt.times(avgInterestRate);
      const netRentCashFlow = approxNoi.minus(approxInterest);

      yearByYear.push({
        year: yr,
        calendarYear: new Date().getFullYear() + yr,
        ownerOccupiedValuation: Math.round(ooValuation.toNumber()),
        ownerOccupiedDebt: Math.round(ooDebt.toNumber()),
        investmentValuation: Math.round(invValuation.toNumber()),
        investmentDebt: Math.round(invDebt.toNumber()),
        totalPropertyValuation: Math.round(totalPropVal.toNumber()),
        totalDebt: Math.round(totalDebtVal.toNumber()),
        netEquity: Math.round(netEquityVal.toNumber()),
        superBalance: Math.round(superBalance.toNumber()),
        totalNetAssets: Math.round(totalNetAssetsVal.toNumber()),
        annualGrossRent: Math.round(invGrossRent.toNumber()),
        netRentalCashFlow: Math.round(netRentCashFlow.toNumber()),
        event: event || null,
      });
    }

    const finalYear = yearByYear[yearByYear.length - 1];

    // =========================================================================
    // CAPITAL GAINS TAX (CGT) TREATMENT AT RETIREMENT (forecastYears)
    // =========================================================================
    // Component 1: Pre-1 July 2027 capital gains (transitional 50% discount @ cgtTaxRate)
    // Component 2: Post-1 July 2027 gains (CPI-indexed cost base; 100% real gain taxed @ cgtTaxRate)
    const tReform = 1; // 1 July 2027 is 1 year from FY2026 baseline
    const v0 = baselineData.invPurchasePrice > 0 ? baselineData.invPurchasePrice : (baselineData.invValuation || 0);
    const vReform = (baselineData.invValuation || 0) * Math.pow(1 + propGrowth, tReform);
    const vRetirement = finalYear.investmentValuation;

    const preReformGain = Math.max(0, vReform - v0);
    const taxablePreGain = preReformGain * 0.50; // 50% transitional discount
    const cgtPre = Math.round(taxablePreGain * cgtTaxRate);

    const postYears = Math.max(0, forecastYears - tReform);
    const indexedCostBasePost = vReform * Math.pow(1 + forecastCpi, postYears);
    const postReformGain = Math.max(0, vRetirement - indexedCostBasePost);
    const taxablePostGain = postReformGain; // 100% taxable
    const cgtPost = Math.round(taxablePostGain * cgtTaxRate);

    const totalCgt = cgtPre + cgtPost;

    // =========================================================================
    // INVESTED CAPITAL & RETIREMENT INCOME
    // =========================================================================
    // Net investment equity + released downsizing capital proceeds - total CGT
    const netInvEquityAtRetirement = Math.max(0, finalYear.investmentValuation - finalYear.investmentDebt);
    const rawInvestedCapital = netInvEquityAtRetirement + downsizeToInvestedCapital - totalCgt;
    const projectedInvestedCapital = Math.round(Math.max(0, rawInvestedCapital));

    // Global investment return assumption: 5% p.a., income tax assumption: 30% (3.5% net)
    const netReturnRate = investmentReturn * (1 - incomeTaxRate);
    const projectedInvestedCapitalIncome = Math.round(projectedInvestedCapital * netReturnRate);

    // Superannuation: 5% safe pension drawdown (tax-free in retirement phase)
    const superPensionIncome = Math.round(finalYear.superBalance * 0.05);

    // Total Projected After-Tax Income in Retirement
    const totalProjectedAfterTaxIncomeAtRetirement = Math.round(
      projectedInvestedCapitalIncome + superPensionIncome,
    );

    const incomeSurplusOrShortfall =
      totalProjectedAfterTaxIncomeAtRetirement - targetIncome;

    return {
      levers: {
        forecastYears,
        propertyGrowthRate: propGrowth,
        rentalGrowthRate: rentGrowth,
        inflationRate: levers.inflationRate || 0.025,
        superReturnRate: superReturn,
        extraMonthlyHomeLoanRepayment: extraMonthlyHomeLoan,
        downsizeEnabled,
        downsizeYearOffset: downsizeYear,
        downsizeNetProceedsToSuper: downsizeProceeds,
        targetRetirementIncomeAfterTax: targetIncome,
        netYield,
        forecastCpi,
        cgtTaxRate,
        investmentReturn,
        incomeTaxRate,
        downsizeHomePriceToday,
      },
      heroOutputs: {
        totalProjectedAfterTaxIncomeAtRetirement,
        targetRetirementIncomeAfterTax: targetIncome,
        incomeSurplusOrShortfall,
        isTargetMet: incomeSurplusOrShortfall >= 0,
        totalAssetsAtRetirement: finalYear.totalNetAssets,
        totalSuperAtRetirement: finalYear.superBalance,
        totalPropertyValuationAtRetirement: finalYear.totalPropertyValuation,
        totalDebtAtRetirement: finalYear.totalDebt,
        totalNetEquityAtRetirement: finalYear.netEquity,
        projectedInvestedCapital,
        projectedInvestedCapitalIncome,
        superPensionIncome,
        totalCgtAtRetirement: totalCgt,
        cgtPreReform: cgtPre,
        cgtPostReform: cgtPost,
        downsizeReleasedCapital,
        downsizeToSuper,
        downsizeToInvestedCapital,
      },
      yearByYearProjections: yearByYear,
      methodologyDisclosures:
        'DISCLAIMER: Projections are illustrative models based on adviser-entered assumptions (property growth, rental growth, super returns, inflation, and debt reduction). They do not guarantee future investment returns, taxation laws, or interest rates.',
    };
  }

  async getScenario(adviserId: string, reviewId: string) {
    const review = await this.getReviewWithHousehold(adviserId, reviewId);
    const baseline = this.extractBaselines(review);

    const saved = review.futureOutlook;
    const assumptions = (saved?.assumptionsJson as any) || {};

    const levers: FutureOutlookLeversDto = {
      forecastYears: saved?.forecastYears || 15,
      propertyGrowthRate: saved ? Number(saved.propertyGrowthRate) : 0.05,
      rentalGrowthRate: saved ? Number(saved.rentalGrowthRate) : 0.035,
      inflationRate: saved ? Number(saved.inflationRate) : 0.025,
      superReturnRate: saved ? Number(saved.superReturnRate) : 0.07,
      extraMonthlyHomeLoanRepayment: saved ? Number(saved.extraMonthlyHomeLoanRepayment) : 0,
      downsizeEnabled: saved ? saved.downsizeEnabled : false,
      downsizeYearOffset: saved?.downsizeYearOffset || 10,
      downsizeNetProceedsToSuper: saved ? Number(saved.downsizeNetProceedsToSuper) : 0,
      targetRetirementIncomeAfterTax: saved ? Number(saved.targetRetirementIncomeAfterTax) : 140000,
      netYield: assumptions.netYield !== undefined ? assumptions.netYield : baseline.baselineNetYield,
      forecastCpi: assumptions.forecastCpi !== undefined ? assumptions.forecastCpi : 0.030,
      cgtTaxRate: assumptions.cgtTaxRate !== undefined ? assumptions.cgtTaxRate : 0.30,
      taxReformDate: assumptions.taxReformDate || '1/7/2027',
      investmentReturn: assumptions.investmentReturn !== undefined ? assumptions.investmentReturn : 0.05,
      incomeTaxRate: assumptions.incomeTaxRate !== undefined ? assumptions.incomeTaxRate : 0.30,
      downsizeHomePriceToday: assumptions.downsizeHomePriceToday !== undefined ? assumptions.downsizeHomePriceToday : 0,
    };

    return this.calculateProjections(baseline, levers);
  }

  async simulate(adviserId: string, reviewId: string, levers: FutureOutlookLeversDto) {
    const review = await this.getReviewWithHousehold(adviserId, reviewId);
    const baseline = this.extractBaselines(review);
    return this.calculateProjections(baseline, levers);
  }

  async saveScenario(adviserId: string, reviewId: string, dto: FutureOutlookLeversDto) {
    await this.getReviewWithHousehold(adviserId, reviewId);

    const assumptionsJson = {
      netYield: dto.netYield,
      forecastCpi: dto.forecastCpi,
      cgtTaxRate: dto.cgtTaxRate,
      taxReformDate: dto.taxReformDate || '1/7/2027',
      investmentReturn: dto.investmentReturn,
      incomeTaxRate: dto.incomeTaxRate,
      downsizeHomePriceToday: dto.downsizeHomePriceToday,
    };

    return this.prisma.futureOutlookScenario.upsert({
      where: { annualReviewId: reviewId },
      create: {
        annualReviewId: reviewId,
        forecastYears: dto.forecastYears || 15,
        propertyGrowthRate: dto.propertyGrowthRate !== undefined ? dto.propertyGrowthRate : 0.05,
        rentalGrowthRate: dto.rentalGrowthRate !== undefined ? dto.rentalGrowthRate : 0.035,
        inflationRate: dto.inflationRate !== undefined ? dto.inflationRate : 0.025,
        superReturnRate: dto.superReturnRate !== undefined ? dto.superReturnRate : 0.07,
        extraMonthlyHomeLoanRepayment: dto.extraMonthlyHomeLoanRepayment || 0,
        downsizeEnabled: dto.downsizeEnabled || false,
        downsizeYearOffset: dto.downsizeYearOffset || 10,
        downsizeNetProceedsToSuper: dto.downsizeNetProceedsToSuper || 0,
        targetRetirementIncomeAfterTax: dto.targetRetirementIncomeAfterTax || 140000,
        assumptionsJson,
      },
      update: {
        forecastYears: dto.forecastYears,
        propertyGrowthRate: dto.propertyGrowthRate,
        rentalGrowthRate: dto.rentalGrowthRate,
        inflationRate: dto.inflationRate,
        superReturnRate: dto.superReturnRate,
        extraMonthlyHomeLoanRepayment: dto.extraMonthlyHomeLoanRepayment,
        downsizeEnabled: dto.downsizeEnabled,
        downsizeYearOffset: dto.downsizeYearOffset,
        downsizeNetProceedsToSuper: dto.downsizeNetProceedsToSuper,
        targetRetirementIncomeAfterTax: dto.targetRetirementIncomeAfterTax,
        assumptionsJson,
      },
    });
  }

  private extractBaselines(review: any) {
    let ooVal = 0;
    let ooDebt = 0;
    let ooPurchasePrice = 0;
    let invVal = 0;
    let invDebt = 0;
    let invGrossRent = 0;
    let invPurchasePrice = 0;

    for (const prop of review.household.properties) {
      const snap =
        review.propertySnapshots.find((s: any) => s.propertyId === prop.id) ||
        null;
      const val = snap ? Number(snap.valuation) : Number(prop.purchasePrice);
      const purchasePrice = Number(prop.purchasePrice || 0);

      let propDebt = 0;
      for (const loan of prop.loans) {
        const ls = review.loanSnapshots.find((s: any) => s.loanId === loan.id);
        const bal = ls ? Number(ls.loanBalance) : 0;
        const offset = ls ? Number(ls.offsetBalance) : 0;
        propDebt += Math.max(0, bal - offset);
      }

      if (prop.type === 'OWNER_OCCUPIED') {
        ooVal += val;
        ooDebt += propDebt;
        ooPurchasePrice += purchasePrice;
      } else {
        invVal += val;
        invDebt += propDebt;
        invGrossRent += snap ? Number(snap.annualGrossRent) : 0;
        invPurchasePrice += purchasePrice;
      }
    }

    let superBalance = 0;
    let annualSuperContrib = 0;
    for (const member of review.household.members) {
      superBalance += Number(member.currentSuperBalance || 0);
      annualSuperContrib += Number(member.annualSuperContribution || 0);
    }

    const baselineNetYield =
      invVal > 0 && invGrossRent > 0 ? (invGrossRent * 0.65) / invVal : 0.035;

    const adultCount = Math.max(1, review.household.members?.length || 2);

    return {
      ooValuation: ooVal,
      ooDebt,
      ooPurchasePrice,
      invValuation: invVal,
      invDebt,
      invGrossRent,
      invPurchasePrice,
      baselineNetYield,
      adultCount,
      superBalance,
      annualSuperContrib,
      avgInterestRate: 0.0595,
    };
  }
}
