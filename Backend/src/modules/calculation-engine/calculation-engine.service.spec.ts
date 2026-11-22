import { CalculationEngineService } from './calculation-engine.service';
import { PropertyFinancialInputs } from './calculation-engine.types';

describe('CalculationEngineService (Financial Core & Locked Domain Rules)', () => {
  let service: CalculationEngineService;

  beforeEach(() => {
    service = new CalculationEngineService();
  });

  describe('1. Owner-Occupied Property Segregation Rule', () => {
    const ownerOccupiedInput: PropertyFinancialInputs = {
      id: 'prop-oo-1',
      name: 'Primary Residence - Bellevue Hill',
      type: 'OWNER_OCCUPIED',
      purchaseDate: '2019-01-01',
      purchasePrice: 2000000,
      acquisitionCosts: 100000,
      valuation: 3000000,
      weeklyRent: 0,
      annualGrossRent: 0,
      councilRates: 2400,
      insurance: 2000,
      loans: [
        {
          id: 'loan-oo-1',
          loanBalance: 1200000,
          offsetBalance: 200000,
          interestRate: 0.0585,
          interestPaid: 58500,
        },
      ],
    };

    it('should compute Valuation, Debt, Net Debt, Equity, and LVR for Owner-Occupied property', () => {
      const result = service.calculatePropertyMetrics(ownerOccupiedInput);

      expect(result.propertyType).toBe('OWNER_OCCUPIED');
      expect(result.isOwnerOccupied).toBe(true);
      expect(result.currentValuation).toBe(3000000);
      expect(result.totalLoanBalance).toBe(1200000);
      expect(result.totalOffsetBalance).toBe(200000);
      expect(result.netDebt).toBe(1000000); // 1.2M - 200k offset
      expect(result.currentEquity).toBe(2000000); // 3M - 1M
      expect(result.lvr).toBeCloseTo(0.3333, 4); // 1M / 3M = 33.33%
    });

    it('MANDATORY LOCK: Owner-Occupied MUST return null for yields, cash flow, NOI, expense ratio, and CAGR', () => {
      const result = service.calculatePropertyMetrics(ownerOccupiedInput);

      expect(result.grossYield).toBeNull();
      expect(result.netYield).toBeNull();
      expect(result.noi).toBeNull();
      expect(result.preTaxCashFlow).toBeNull();
      expect(result.taxableIncome).toBeNull();
      expect(result.taxImpact).toBeNull();
      expect(result.postTaxCashFlow).toBeNull();
      expect(result.operatingExpenseRatio).toBeNull();
      expect(result.cagr).toBeNull();
      expect(result.expenseBreakdown).toBeNull();
      expect(result.annualGrossRent).toBeNull();
      expect(result.effectiveRent).toBeNull();
    });
  });

  describe('2. Investment Property Pure Financial Calculations', () => {
    const investmentInput: PropertyFinancialInputs = {
      id: 'prop-inv-1',
      name: 'Bondi Beach Apartment',
      type: 'INVESTMENT',
      purchaseDate: '2020-01-01',
      asAtDate: '2025-01-01', // exactly 5 years
      purchasePrice: 900000,
      acquisitionCosts: 40000, // total cost basis: 940,000
      valuation: 1200000,
      weeklyRent: 800,
      annualGrossRent: 41600, // 800 * 52
      vacancyWeeks: 2, // 41600 * (2/52) = 1600 loss => effective rent = 40,000
      councilRates: 1500,
      waterRates: 800,
      insurance: 1200,
      propertyManagementFees: 2496, // 6%
      repairsMaintenance: 1000,
      landTax: 0,
      strataFees: 3004,
      otherExpenses: 0, // total operating expenses = 10,000
      depreciationNonCash: 5000,
      marginalTaxRate: 0.37,
      loans: [
        {
          id: 'loan-inv-1',
          loanBalance: 600000,
          offsetBalance: 50000,
          interestRate: 0.06,
          interestPaid: 33000, // 550,000 * 6%
        },
      ],
    };

    it('should accurately compute investment metrics: NOI, yields, cash flows, and CAGR', () => {
      const result = service.calculatePropertyMetrics(investmentInput);

      expect(result.isOwnerOccupied).toBe(false);
      expect(result.totalPurchaseCost).toBe(940000);
      expect(result.currentValuation).toBe(1200000);
      expect(result.netDebt).toBe(550000);
      expect(result.currentEquity).toBe(650000);
      expect(result.lvr).toBeCloseTo(550000 / 1200000, 4);

      // Gross Yield = 41,600 / 1,200,000 = 0.034666... (3.47%)
      expect(result.grossYield).toBeCloseTo(41600 / 1200000, 4);

      // Effective Rent = 40,000; Expenses = 10,000 => NOI = 30,000
      expect(result.cashOperatingExpenses).toBe(10000);
      expect(result.effectiveRent).toBe(40000);
      expect(result.noi).toBe(30000);

      // Net Yield = 30,000 / 1,200,000 = 0.025 (2.5%)
      expect(result.netYield).toBeCloseTo(0.025, 4);

      // Operating Expense Ratio = 10,000 / 41,600 = 0.24038 (24.04%)
      expect(result.operatingExpenseRatio).toBeCloseTo(10000 / 41600, 4);

      // Pre-Tax Cash Flow = NOI (30,000) - Interest Paid (33,000) = -3,000 (negative gearing)
      expect(result.preTaxCashFlow).toBe(-3000);

      // Taxable Income = NOI (30,000) - Interest (33,000) - Depreciation (5,000) = -8,000
      expect(result.taxableIncome).toBe(-8000);

      // Tax Impact = -8,000 * 0.37 = -2,960 (Tax refund / benefit)
      expect(result.taxImpact).toBe(-2960);

      // Post-Tax Cash Flow = Pre-Tax (-3,000) - Tax Impact (-2,960) = -40
      expect(result.postTaxCashFlow).toBe(-40);

      // CAGR over 5 years: (1,200,000 / 940,000) ^ (1/5) - 1
      const expectedCagr = Math.pow(1200000 / 940000, 1 / 5) - 1;
      expect(result.cagr).toBeCloseTo(expectedCagr, 4);
    });

    it('should compute dual-axis expense breakdown in $ and % of gross rent', () => {
      const result = service.calculatePropertyMetrics(investmentInput);
      const breakdown = result.expenseBreakdown!;

      expect(breakdown).toBeDefined();
      expect(breakdown.councilRates.amount).toBe(1500);
      expect(breakdown.councilRates.percentageOfRent).toBeCloseTo(1500 / 41600, 4);

      expect(breakdown.strataFees.amount).toBe(3004);
      expect(breakdown.strataFees.percentageOfRent).toBeCloseTo(3004 / 41600, 4);

      expect(breakdown.total.amount).toBe(10000);
      expect(breakdown.total.percentageOfRent).toBeCloseTo(10000 / 41600, 4);
    });
  });

  describe('3. Portfolio Aggregation & Owner-Occupied Exclusion Rule', () => {
    it('LOCKED RULE: Portfolio Overview strictly excludes Owner-Occupied properties from yields and totals', () => {
      const ooProperty = service.calculatePropertyMetrics({
        id: 'oo-1',
        name: 'Family Home',
        type: 'OWNER_OCCUPIED',
        purchaseDate: '2015-01-01',
        purchasePrice: 2000000,
        valuation: 3500000,
        loans: [{ id: 'l1', loanBalance: 1000000, interestRate: 0.058 }],
      });

      const invProperty1 = service.calculatePropertyMetrics({
        id: 'inv-1',
        name: 'Investment Flat 1',
        type: 'INVESTMENT',
        purchaseDate: '2020-01-01',
        asAtDate: '2025-01-01',
        purchasePrice: 800000,
        valuation: 1000000,
        annualGrossRent: 40000,
        councilRates: 1000,
        waterRates: 500,
        insurance: 1000,
        propertyManagementFees: 2000,
        repairsMaintenance: 500,
        loans: [{ id: 'l2', loanBalance: 600000, interestRate: 0.06, interestPaid: 36000 }],
      });

      const invProperty2 = service.calculatePropertyMetrics({
        id: 'inv-2',
        name: 'Investment House 2',
        type: 'INVESTMENT',
        purchaseDate: '2021-01-01',
        asAtDate: '2025-01-01',
        purchasePrice: 1200000,
        valuation: 1500000,
        annualGrossRent: 60000,
        councilRates: 1500,
        waterRates: 800,
        insurance: 1200,
        propertyManagementFees: 3000,
        repairsMaintenance: 500,
        loans: [{ id: 'l3', loanBalance: 900000, interestRate: 0.06, interestPaid: 54000 }],
      });

      const portfolio = service.calculatePortfolioMetrics([ooProperty, invProperty1, invProperty2]);

      expect(portfolio.totalPropertiesCount).toBe(3);
      expect(portfolio.investmentPropertiesCount).toBe(2);
      expect(portfolio.ownerOccupiedCount).toBe(1);

      // Total investment valuation must be 1.0M + 1.5M = 2.5M (EXCLUDES 3.5M OO home!)
      expect(portfolio.totalInvestmentValuation).toBe(2500000);

      // Total investment debt = 600k + 900k = 1.5M (EXCLUDES 1.0M home loan!)
      expect(portfolio.totalInvestmentDebt).toBe(1500000);
      expect(portfolio.totalInvestmentNetDebt).toBe(1500000);
      expect(portfolio.totalInvestmentEquity).toBe(1000000); // 2.5M - 1.5M
      expect(portfolio.portfolioLvr).toBe(0.6); // 1.5M / 2.5M = 60%

      // Total gross rent = 40,000 + 60,000 = 100,000
      expect(portfolio.totalAnnualGrossRent).toBe(100000);
      expect(portfolio.portfolioGrossYield).toBe(100000 / 2500000); // 4%
    });
  });
});
