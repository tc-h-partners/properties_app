import Decimal from 'decimal.js';

export interface PropertyFinancialInputs {
  id: string;
  name: string;
  type: 'INVESTMENT' | 'OWNER_OCCUPIED';
  purchaseDate: Date | string;
  purchasePrice: number | string | Decimal;
  acquisitionCosts?: number | string | Decimal;
  valuation: number | string | Decimal;
  weeklyRent?: number | string | Decimal;
  annualGrossRent?: number | string | Decimal;
  vacancyWeeks?: number | string | Decimal;
  councilRates?: number | string | Decimal;
  waterRates?: number | string | Decimal;
  insurance?: number | string | Decimal;
  propertyManagementFees?: number | string | Decimal;
  repairsMaintenance?: number | string | Decimal;
  landTax?: number | string | Decimal;
  strataFees?: number | string | Decimal;
  otherExpenses?: number | string | Decimal;
  depreciationNonCash?: number | string | Decimal;
  marginalTaxRate?: number | string | Decimal;
  loans: LoanFinancialInputs[];
  asAtDate?: Date | string;
}

export interface LoanFinancialInputs {
  id: string;
  accountName?: string;
  loanType?: string;
  loanBalance: number | string | Decimal;
  offsetBalance?: number | string | Decimal;
  interestRate: number | string | Decimal; // e.g. 0.0595 for 5.95% or 5.95 (handled automatically)
  annualRepayments?: number | string | Decimal;
  interestPaid?: number | string | Decimal;
  loanLimit?: number | string | Decimal;
}

export interface CalculatedPropertyMetrics {
  propertyId: string;
  propertyName: string;
  propertyType: 'INVESTMENT' | 'OWNER_OCCUPIED';
  isOwnerOccupied: boolean;
  totalPurchaseCost: number;
  currentValuation: number;
  totalLoanBalance: number;
  totalOffsetBalance: number;
  netDebt: number;
  currentEquity: number;
  lvr: number; // e.g. 0.65 for 65%
  weightedAvgInterestRate: number; // e.g. 0.0595
  yearsHeld: number;
  capitalGrowthDollar: number;
  capitalGrowthPercentage: number | null;
  cagr: number | null; // null for OO
  annualGrossRent: number | null; // null for OO
  weeklyRent: number | null; // null for OO
  effectiveRent: number | null; // null for OO
  cashOperatingExpenses: number | null; // null for OO
  operatingExpenseRatio: number | null; // null for OO
  noi: number | null; // null for OO
  grossYield: number | null; // null for OO
  netYield: number | null; // null for OO
  totalInterestPaid: number | null; // null for OO
  preTaxCashFlow: number | null; // null for OO
  taxableIncome: number | null; // null for OO
  taxImpact: number | null; // null for OO
  postTaxCashFlow: number | null; // null for OO
  expenseBreakdown: {
    councilRates: { amount: number; percentageOfRent: number | null };
    waterRates: { amount: number; percentageOfRent: number | null };
    insurance: { amount: number; percentageOfRent: number | null };
    propertyManagementFees: { amount: number; percentageOfRent: number | null };
    repairsMaintenance: { amount: number; percentageOfRent: number | null };
    landTax: { amount: number; percentageOfRent: number | null };
    strataFees: { amount: number; percentageOfRent: number | null };
    otherExpenses: { amount: number; percentageOfRent: number | null };
    total: { amount: number; percentageOfRent: number | null };
  } | null;
}

export interface PortfolioSummaryMetrics {
  totalPropertiesCount: number;
  investmentPropertiesCount: number;
  ownerOccupiedCount: number;
  totalInvestmentValuation: number;
  totalInvestmentDebt: number;
  totalInvestmentOffset: number;
  totalInvestmentNetDebt: number;
  totalInvestmentEquity: number;
  portfolioLvr: number;
  portfolioWeightedAvgInterestRate: number;
  totalAnnualGrossRent: number;
  totalCashOperatingExpenses: number;
  portfolioOperatingExpenseRatio: number;
  totalNoi: number;
  portfolioGrossYield: number;
  portfolioNetYield: number;
  totalInterestPaid: number;
  totalPreTaxCashFlow: number;
  totalTaxImpact: number;
  totalPostTaxCashFlow: number;
  portfolioCagr: number;
  expenseBreakdown: {
    councilRates: { amount: number; percentageOfRent: number };
    waterRates: { amount: number; percentageOfRent: number };
    insurance: { amount: number; percentageOfRent: number };
    propertyManagementFees: { amount: number; percentageOfRent: number };
    repairsMaintenance: { amount: number; percentageOfRent: number };
    landTax: { amount: number; percentageOfRent: number };
    strataFees: { amount: number; percentageOfRent: number };
    otherExpenses: { amount: number; percentageOfRent: number };
    total: { amount: number; percentageOfRent: number };
  };
}
