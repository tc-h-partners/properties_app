import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import {
  PropertyFinancialInputs,
  CalculatedPropertyMetrics,
  PortfolioSummaryMetrics,
} from './calculation-engine.types';

@Injectable()
export class CalculationEngineService {
  /**
   * Safe conversion of any input value to Decimal
   */
  private toDecimal(val: number | string | Decimal | null | undefined, fallback = 0): Decimal {
    if (val === null || val === undefined) return new Decimal(fallback);
    try {
      const d = new Decimal(val.toString());
      return d.isNaN() ? new Decimal(fallback) : d;
    } catch {
      return new Decimal(fallback);
    }
  }

  /**
   * Normalizes rates (if entered as 5.5 instead of 0.055, divide by 100)
   */
  private normalizeRate(val: number | string | Decimal | null | undefined): Decimal {
    const d = this.toDecimal(val, 0);
    return d.greaterThan(1) ? d.dividedBy(100) : d;
  }

  /**
   * Computes property-level metrics following all locked domain rules.
   */
  calculatePropertyMetrics(input: PropertyFinancialInputs): CalculatedPropertyMetrics {
    const isOO = input.type === 'OWNER_OCCUPIED';
    const purchasePrice = this.toDecimal(input.purchasePrice);
    const acqCosts = this.toDecimal(input.acquisitionCosts, 0);
    const totalPurchaseCost = purchasePrice.plus(acqCosts);
    const valuation = this.toDecimal(input.valuation);

    // Loan calculations
    let totalLoanBalance = new Decimal(0);
    let totalOffsetBalance = new Decimal(0);
    let weightedRateNumerator = new Decimal(0);
    let totalInterestPaidCalc = new Decimal(0);

    const loans = input.loans || [];
    for (const loan of loans) {
      const balance = this.toDecimal(loan.loanBalance, 0);
      const offset = this.toDecimal(loan.offsetBalance, 0);
      const rate = this.normalizeRate(loan.interestRate);
      const interestPaid = this.toDecimal(
        loan.interestPaid !== undefined ? loan.interestPaid : balance.times(rate),
        0,
      );

      totalLoanBalance = totalLoanBalance.plus(balance);
      totalOffsetBalance = totalOffsetBalance.plus(offset);
      weightedRateNumerator = weightedRateNumerator.plus(balance.times(rate));
      totalInterestPaidCalc = totalInterestPaidCalc.plus(interestPaid);
    }

    const netDebt = Decimal.max(0, totalLoanBalance.minus(totalOffsetBalance));
    const currentEquity = valuation.minus(netDebt);
    const lvr = valuation.greaterThan(0) ? netDebt.dividedBy(valuation) : new Decimal(0);
    const weightedAvgRate = totalLoanBalance.greaterThan(0)
      ? weightedRateNumerator.dividedBy(totalLoanBalance)
      : new Decimal(0);

    // Holding duration & Capital Growth
    const purchaseDate = new Date(input.purchaseDate);
    const asAtDate = input.asAtDate ? new Date(input.asAtDate) : new Date();
    const diffMs = Math.max(0, asAtDate.getTime() - purchaseDate.getTime());
    const yearsHeldExact = Math.max(0.0833, diffMs / (1000 * 60 * 60 * 24 * 365.25));

    const capitalGrowthDollar = valuation.minus(totalPurchaseCost);
    const capitalGrowthPercentage = totalPurchaseCost.greaterThan(0)
      ? capitalGrowthDollar.dividedBy(totalPurchaseCost)
      : null;

    // LOCKED RULE: Owner-Occupied properties must return null for yields, cash flows, and investment CAGR
    if (isOO) {
      return {
        propertyId: input.id,
        propertyName: input.name,
        propertyType: 'OWNER_OCCUPIED',
        isOwnerOccupied: true,
        totalPurchaseCost: totalPurchaseCost.toNumber(),
        currentValuation: valuation.toNumber(),
        totalLoanBalance: totalLoanBalance.toNumber(),
        totalOffsetBalance: totalOffsetBalance.toNumber(),
        netDebt: netDebt.toNumber(),
        currentEquity: currentEquity.toNumber(),
        lvr: lvr.toNumber(),
        weightedAvgInterestRate: weightedAvgRate.toNumber(),
        yearsHeld: Number(yearsHeldExact.toFixed(2)),
        capitalGrowthDollar: capitalGrowthDollar.toNumber(),
        capitalGrowthPercentage: capitalGrowthPercentage ? capitalGrowthPercentage.toNumber() : null,
        cagr: null,
        annualGrossRent: null,
        weeklyRent: null,
        effectiveRent: null,
        cashOperatingExpenses: null,
        operatingExpenseRatio: null,
        noi: null,
        grossYield: null,
        netYield: null,
        totalInterestPaid: null,
        preTaxCashFlow: null,
        taxableIncome: null,
        taxImpact: null,
        postTaxCashFlow: null,
        expenseBreakdown: null,
      };
    }

    // INVESTMENT PROPERTY CALCULATIONS
    const annualGrossRent = input.annualGrossRent !== undefined && input.annualGrossRent !== null
      ? this.toDecimal(input.annualGrossRent)
      : this.toDecimal(input.weeklyRent, 0).times(52);

    const weeklyRent = input.weeklyRent !== undefined && input.weeklyRent !== null
      ? this.toDecimal(input.weeklyRent)
      : annualGrossRent.dividedBy(52);

    const vacancyWeeks = this.toDecimal(input.vacancyWeeks, 0);
    const vacancyLoss = annualGrossRent.times(vacancyWeeks.dividedBy(52));
    const effectiveRent = Decimal.max(0, annualGrossRent.minus(vacancyLoss));

    // Operating expenses
    const council = this.toDecimal(input.councilRates, 0);
    const water = this.toDecimal(input.waterRates, 0);
    const insurance = this.toDecimal(input.insurance, 0);
    const mgmt = this.toDecimal(input.propertyManagementFees, 0);
    const repairs = this.toDecimal(input.repairsMaintenance, 0);
    const landTax = this.toDecimal(input.landTax, 0);
    const strata = this.toDecimal(input.strataFees, 0);
    const other = this.toDecimal(input.otherExpenses, 0);

    const cashOperatingExpenses = council
      .plus(water)
      .plus(insurance)
      .plus(mgmt)
      .plus(repairs)
      .plus(landTax)
      .plus(strata)
      .plus(other);

    const operatingExpenseRatio = annualGrossRent.greaterThan(0)
      ? cashOperatingExpenses.dividedBy(annualGrossRent)
      : new Decimal(0);

    const noi = effectiveRent.minus(cashOperatingExpenses);
    const grossYield = valuation.greaterThan(0) ? annualGrossRent.dividedBy(valuation) : new Decimal(0);
    const netYield = valuation.greaterThan(0) ? noi.dividedBy(valuation) : new Decimal(0);

    const preTaxCashFlow = noi.minus(totalInterestPaidCalc);
    const depreciation = this.toDecimal(input.depreciationNonCash, 0);
    const marginalTaxRate = this.normalizeRate(input.marginalTaxRate !== undefined ? input.marginalTaxRate : 0.37);

    // Taxable Income = NOI - Interest Paid - Depreciation
    const taxableIncome = noi.minus(totalInterestPaidCalc).minus(depreciation);
    const taxImpact = taxableIncome.times(marginalTaxRate);
    const postTaxCashFlow = preTaxCashFlow.minus(taxImpact);

    // CAGR = (valuation / totalPurchaseCost) ^ (1 / yearsHeld) - 1
    let cagrVal: Decimal = new Decimal(0);
    if (totalPurchaseCost.greaterThan(0) && valuation.greaterThan(0) && yearsHeldExact > 0) {
      try {
        const ratio = valuation.dividedBy(totalPurchaseCost).toNumber();
        const exponent = 1 / yearsHeldExact;
        cagrVal = new Decimal(Math.pow(ratio, exponent) - 1);
      } catch {
        cagrVal = new Decimal(0);
      }
    }

    const calcExpPct = (amount: Decimal) =>
      annualGrossRent.greaterThan(0) ? amount.dividedBy(annualGrossRent).toNumber() : 0;

    return {
      propertyId: input.id,
      propertyName: input.name,
      propertyType: 'INVESTMENT',
      isOwnerOccupied: false,
      totalPurchaseCost: totalPurchaseCost.toNumber(),
      currentValuation: valuation.toNumber(),
      totalLoanBalance: totalLoanBalance.toNumber(),
      totalOffsetBalance: totalOffsetBalance.toNumber(),
      netDebt: netDebt.toNumber(),
      currentEquity: currentEquity.toNumber(),
      lvr: lvr.toNumber(),
      weightedAvgInterestRate: weightedAvgRate.toNumber(),
      yearsHeld: Number(yearsHeldExact.toFixed(2)),
      capitalGrowthDollar: capitalGrowthDollar.toNumber(),
      capitalGrowthPercentage: capitalGrowthPercentage ? capitalGrowthPercentage.toNumber() : 0,
      cagr: cagrVal.toNumber(),
      annualGrossRent: annualGrossRent.toNumber(),
      weeklyRent: weeklyRent.toNumber(),
      effectiveRent: effectiveRent.toNumber(),
      cashOperatingExpenses: cashOperatingExpenses.toNumber(),
      operatingExpenseRatio: operatingExpenseRatio.toNumber(),
      noi: noi.toNumber(),
      grossYield: grossYield.toNumber(),
      netYield: netYield.toNumber(),
      totalInterestPaid: totalInterestPaidCalc.toNumber(),
      preTaxCashFlow: preTaxCashFlow.toNumber(),
      taxableIncome: taxableIncome.toNumber(),
      taxImpact: taxImpact.toNumber(),
      postTaxCashFlow: postTaxCashFlow.toNumber(),
      expenseBreakdown: {
        councilRates: { amount: council.toNumber(), percentageOfRent: calcExpPct(council) },
        waterRates: { amount: water.toNumber(), percentageOfRent: calcExpPct(water) },
        insurance: { amount: insurance.toNumber(), percentageOfRent: calcExpPct(insurance) },
        propertyManagementFees: { amount: mgmt.toNumber(), percentageOfRent: calcExpPct(mgmt) },
        repairsMaintenance: { amount: repairs.toNumber(), percentageOfRent: calcExpPct(repairs) },
        landTax: { amount: landTax.toNumber(), percentageOfRent: calcExpPct(landTax) },
        strataFees: { amount: strata.toNumber(), percentageOfRent: calcExpPct(strata) },
        otherExpenses: { amount: other.toNumber(), percentageOfRent: calcExpPct(other) },
        total: { amount: cashOperatingExpenses.toNumber(), percentageOfRent: calcExpPct(cashOperatingExpenses) },
      },
    };
  }

  /**
   * Aggregates portfolio metrics.
   * LOCKED RULE: Strictly filters `property.type === 'INVESTMENT'`.
   * Owner-Occupied homes are excluded from investment overview KPIs.
   */
  calculatePortfolioMetrics(metricsList: CalculatedPropertyMetrics[]): PortfolioSummaryMetrics {
    const investmentOnly = metricsList.filter((m) => m.propertyType === 'INVESTMENT');
    const ooCount = metricsList.filter((m) => m.propertyType === 'OWNER_OCCUPIED').length;

    let totalValuation = new Decimal(0);
    let totalDebt = new Decimal(0);
    let totalOffset = new Decimal(0);
    let totalNetDebt = new Decimal(0);
    let totalGrossRent = new Decimal(0);
    let totalCashExpenses = new Decimal(0);
    let totalNoi = new Decimal(0);
    let totalInterest = new Decimal(0);
    let totalPreTax = new Decimal(0);
    let totalTaxImpact = new Decimal(0);
    let totalPostTax = new Decimal(0);
    let totalCostBasis = new Decimal(0);
    let weightedRateNumerator = new Decimal(0);

    // Expense breakdowns
    let sumCouncil = new Decimal(0);
    let sumWater = new Decimal(0);
    let sumInsurance = new Decimal(0);
    let sumMgmt = new Decimal(0);
    let sumRepairs = new Decimal(0);
    let sumLandTax = new Decimal(0);
    let sumStrata = new Decimal(0);
    let sumOther = new Decimal(0);

    for (const inv of investmentOnly) {
      const val = new Decimal(inv.currentValuation);
      const debt = new Decimal(inv.totalLoanBalance);
      const offset = new Decimal(inv.totalOffsetBalance);
      const net = new Decimal(inv.netDebt);
      const cost = new Decimal(inv.totalPurchaseCost);
      const rent = new Decimal(inv.annualGrossRent || 0);
      const exp = new Decimal(inv.cashOperatingExpenses || 0);
      const noi = new Decimal(inv.noi || 0);
      const interest = new Decimal(inv.totalInterestPaid || 0);
      const pre = new Decimal(inv.preTaxCashFlow || 0);
      const tax = new Decimal(inv.taxImpact || 0);
      const post = new Decimal(inv.postTaxCashFlow || 0);
      const rate = new Decimal(inv.weightedAvgInterestRate || 0);

      totalValuation = totalValuation.plus(val);
      totalDebt = totalDebt.plus(debt);
      totalOffset = totalOffset.plus(offset);
      totalNetDebt = totalNetDebt.plus(net);
      totalCostBasis = totalCostBasis.plus(cost);
      totalGrossRent = totalGrossRent.plus(rent);
      totalCashExpenses = totalCashExpenses.plus(exp);
      totalNoi = totalNoi.plus(noi);
      totalInterest = totalInterest.plus(interest);
      totalPreTax = totalPreTax.plus(pre);
      totalTaxImpact = totalTaxImpact.plus(tax);
      totalPostTax = totalPostTax.plus(post);
      weightedRateNumerator = weightedRateNumerator.plus(debt.times(rate));

      if (inv.expenseBreakdown) {
        sumCouncil = sumCouncil.plus(inv.expenseBreakdown.councilRates.amount);
        sumWater = sumWater.plus(inv.expenseBreakdown.waterRates.amount);
        sumInsurance = sumInsurance.plus(inv.expenseBreakdown.insurance.amount);
        sumMgmt = sumMgmt.plus(inv.expenseBreakdown.propertyManagementFees.amount);
        sumRepairs = sumRepairs.plus(inv.expenseBreakdown.repairsMaintenance.amount);
        sumLandTax = sumLandTax.plus(inv.expenseBreakdown.landTax.amount);
        sumStrata = sumStrata.plus(inv.expenseBreakdown.strataFees.amount);
        sumOther = sumOther.plus(inv.expenseBreakdown.otherExpenses.amount);
      }
    }

    const totalEquity = totalValuation.minus(totalNetDebt);
    const portfolioLvr = totalValuation.greaterThan(0)
      ? totalNetDebt.dividedBy(totalValuation).toNumber()
      : 0;

    const portfolioRate = totalDebt.greaterThan(0)
      ? weightedRateNumerator.dividedBy(totalDebt).toNumber()
      : 0;

    const portfolioGrossYield = totalValuation.greaterThan(0)
      ? totalGrossRent.dividedBy(totalValuation).toNumber()
      : 0;

    const portfolioNetYield = totalValuation.greaterThan(0)
      ? totalNoi.dividedBy(totalValuation).toNumber()
      : 0;

    const portfolioExpRatio = totalGrossRent.greaterThan(0)
      ? totalCashExpenses.dividedBy(totalGrossRent).toNumber()
      : 0;

    // Portfolio CAGR: weighted CAGR across investment properties by valuation
    let portfolioCagr = 0;
    if (investmentOnly.length > 0 && totalValuation.greaterThan(0)) {
      let weightedCagrSum = new Decimal(0);
      for (const inv of investmentOnly) {
        if (inv.cagr !== null) {
          const weight = new Decimal(inv.currentValuation).dividedBy(totalValuation);
          weightedCagrSum = weightedCagrSum.plus(weight.times(inv.cagr));
        }
      }
      portfolioCagr = weightedCagrSum.toNumber();
    }

    const calcExpPct = (amount: Decimal) =>
      totalGrossRent.greaterThan(0) ? amount.dividedBy(totalGrossRent).toNumber() : 0;

    return {
      totalPropertiesCount: metricsList.length,
      investmentPropertiesCount: investmentOnly.length,
      ownerOccupiedCount: ooCount,
      totalInvestmentValuation: totalValuation.toNumber(),
      totalInvestmentDebt: totalDebt.toNumber(),
      totalInvestmentOffset: totalOffset.toNumber(),
      totalInvestmentNetDebt: totalNetDebt.toNumber(),
      totalInvestmentEquity: totalEquity.toNumber(),
      portfolioLvr,
      portfolioWeightedAvgInterestRate: portfolioRate,
      totalAnnualGrossRent: totalGrossRent.toNumber(),
      totalCashOperatingExpenses: totalCashExpenses.toNumber(),
      portfolioOperatingExpenseRatio: portfolioExpRatio,
      totalNoi: totalNoi.toNumber(),
      portfolioGrossYield: portfolioGrossYield,
      portfolioNetYield: portfolioNetYield,
      totalInterestPaid: totalInterest.toNumber(),
      totalPreTaxCashFlow: totalPreTax.toNumber(),
      totalTaxImpact: totalTaxImpact.toNumber(),
      totalPostTaxCashFlow: totalPostTax.toNumber(),
      portfolioCagr,
      expenseBreakdown: {
        councilRates: { amount: sumCouncil.toNumber(), percentageOfRent: calcExpPct(sumCouncil) },
        waterRates: { amount: sumWater.toNumber(), percentageOfRent: calcExpPct(sumWater) },
        insurance: { amount: sumInsurance.toNumber(), percentageOfRent: calcExpPct(sumInsurance) },
        propertyManagementFees: { amount: sumMgmt.toNumber(), percentageOfRent: calcExpPct(sumMgmt) },
        repairsMaintenance: { amount: sumRepairs.toNumber(), percentageOfRent: calcExpPct(sumRepairs) },
        landTax: { amount: sumLandTax.toNumber(), percentageOfRent: calcExpPct(sumLandTax) },
        strataFees: { amount: sumStrata.toNumber(), percentageOfRent: calcExpPct(sumStrata) },
        otherExpenses: { amount: sumOther.toNumber(), percentageOfRent: calcExpPct(sumOther) },
        total: { amount: totalCashExpenses.toNumber(), percentageOfRent: calcExpPct(totalCashExpenses) },
      },
    };
  }
}
