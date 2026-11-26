"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Clock,
  Route,
  Plus,
  X,
  Home,
  Building2,
  PiggyBank,
  Trash2,
  Filter,
  Check,
  CheckCircle2,
  Copy,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import {
  createInsightApi,
  updateInsightApi,
  deleteInsightApi,
  updateReviewApi,
  completeReviewApi,
  reopenReviewApi,
  saveFutureOutlookApi,
  fetchSystemSettingsApi,
  FutureOutlookGlobalAssumptions,
  DEFAULT_FUTURE_OUTLOOK_ASSUMPTIONS,
  getCachedFutureOutlookAssumptions,
} from "@/lib/api";

export interface ReviewInsightItem {
  id: string;
  reviewId?: string;
  fy: string;
  screen: string;
  property: string;
  maintenanceInsight?: string;
  metric?: string;
  heading: string;
  insight: string;
  recommendation: string;
  priority: "High" | "Medium" | "Low";
  owner?: string;
  action?: string;
  notes?: string;
}

export interface ExecutiveSummaryData {
  totalReturnVal?: string;
  totalReturnSub?: string;
  metricCards?: Array<{
    title: string;
    val: string;
    comp: string;
  }>;
  opportunities?: Array<{
    title: string;
    desc: string;
    amount: string;
  }>;
  risks?: Array<{
    title: string;
    desc: string;
  }>;
  trackGoal?: string;
  trackCurrentPathVal?: string;
  trackActionsVal?: string;
  trackNarrative?: string;
  initiatives?: Array<{
    title: string;
    desc: string;
  }>;
  propertyStrategicRoles?: Record<string, string>;
}

interface ReviewWorkspaceReportProps {
  householdId?: string;
  reviewId?: string;
  dbHousehold?: any;
  onDataChanged?: () => Promise<void> | void;
  householdName?: string;
  reviewYear?: string;
  reviewStatus?: "Completed" | "In Progress";
  readOnly?: boolean;
  onBack: () => void;
  initialTab?:
    | "executive-summary"
    | "portfolio-overview"
    | "property-analysis"
    | "future-outlook"
    | "insights";
}

function fmtMoney(val: any): string {
  const num = Number(String(val ?? 0).replace(/[^0-9.-]/g, ""));
  if (isNaN(num)) return "$0";
  return `$${Math.round(num).toLocaleString("en-AU")}`;
}

function fmtMillions(val: any): string {
  const num = Number(String(val ?? 0).replace(/[^0-9.-]/g, ""));
  if (isNaN(num) || num === 0) return "$0";
  if (Math.abs(num) >= 1000000) {
    return `$${(num / 1000000).toFixed(2)}M`;
  }
  if (Math.abs(num) >= 1000) {
    return `$${Math.round(num / 1000)}k`;
  }
  return `$${Math.round(num)}`;
}

const NET_YIELD_POINTS = [
  {
    id: 0,
    cx: 9.40886,
    cy: 79.0949,
    fy: "FY 2021",
    value: "2.10%",
    trend: "up" as const,
    underlineLeft: 10,
    labelIndex: 0,
  },
  {
    id: 1,
    cx: 85.8366,
    cy: 76.1231,
    fy: "FY 2022",
    value: "2.28%",
    trend: "up" as const,
    underlineLeft: 86,
    labelIndex: 1,
  },
  {
    id: 2,
    cx: 163.837,
    cy: 24.1231,
    fy: "FY 2023",
    value: "5.84%",
    trend: "up" as const,
    underlineLeft: 163,
    labelIndex: 2,
  },
  {
    id: 3,
    cx: 240.837,
    cy: 63.1231,
    fy: "FY 2024",
    value: "3.12%",
    trend: "down" as const,
    underlineLeft: 239,
    labelIndex: 3,
  },
  {
    id: 4,
    cx: 266.837,
    cy: 42.1231,
    fy: "FY 2024",
    value: "2.57%",
    trend: "up" as const,
    underlineLeft: 268.61,
    labelIndex: 3,
  },
  {
    id: 5,
    cx: 317.837,
    cy: 66.1231,
    fy: "FY 2025",
    value: "2.95%",
    trend: "down" as const,
    underlineLeft: 315,
    labelIndex: 4,
  },
  {
    id: 6,
    cx: 396.086,
    cy: 55.3507,
    fy: "FY 2026",
    value: "3.68%",
    trend: "up" as const,
    underlineLeft: 392,
    labelIndex: 5,
  },
  {
    id: 7,
    cx: 473.184,
    cy: 96.9024,
    fy: "FY 2022",
    value: "1.15%",
    trend: "down" as const,
    underlineLeft: 468,
    labelIndex: 6,
  },
];

const BENCHMARK_BARS = [
  {
    id: "subject",
    value: "8.5%",
    height: 134,
    line1: "subject",
    line2: "property",
    spacer: false,
    fadedValue: false,
    diff: "Subject Property (+0.4% vs benchmark)",
  },
  {
    id: "residential",
    value: "8.1%",
    height: 116,
    line1: "Residentials property",
    line2: "benchmark",
    spacer: false,
    fadedValue: false,
    diff: "Benchmark (-0.4% vs subject)",
  },
  {
    id: "asx200",
    value: "5.5%",
    height: 99,
    line1: "ASX 200",
    line2: "spacer",
    spacer: true,
    fadedValue: false,
    diff: "Equities (-3.0% vs subject)",
  },
  {
    id: "cash",
    value: "4.5%",
    height: 87,
    line1: "cash 1st/y",
    line2: "deposit",
    spacer: false,
    fadedValue: true,
    diff: "Cash Deposit (-4.0% vs subject)",
  },
];

const METRIC_CHART_CONFIGS: Record<
  string,
  {
    waveTitle: string;
    waveSubtitle: string;
    benchmarkTitle: string;
    points: typeof NET_YIELD_POINTS;
    bars: typeof BENCHMARK_BARS;
  }
> = {
  "Property Value": {
    waveTitle: "Valuation History & Trend",
    waveSubtitle:
      "Annual capital valuation and appreciation across financial years",
    benchmarkTitle: "Capital Growth Benchmark",
    points: [
      { id: 0, cx: 9.4, cy: 92.2, fy: "FY 2021", value: "$620k", trend: "up", underlineLeft: 10, labelIndex: 0 },
      { id: 1, cx: 85.8, cy: 78.5, fy: "FY 2022", value: "$680k", trend: "up", underlineLeft: 86, labelIndex: 1 },
      { id: 2, cx: 163.8, cy: 68.7, fy: "FY 2023", value: "$720k", trend: "up", underlineLeft: 163, labelIndex: 2 },
      { id: 3, cx: 240.8, cy: 50.9, fy: "FY 2024", value: "$780k", trend: "up", underlineLeft: 239, labelIndex: 3 },
      { id: 4, cx: 266.8, cy: 38.0, fy: "FY 2024", value: "$800k", trend: "up", underlineLeft: 268.6, labelIndex: 3 },
      { id: 5, cx: 317.8, cy: 26.7, fy: "FY 2025", value: "$840k", trend: "up", underlineLeft: 315, labelIndex: 4 },
      { id: 6, cx: 396.1, cy: 15.4, fy: "FY 2026", value: "$890k", trend: "up", underlineLeft: 392, labelIndex: 5 },
      { id: 7, cx: 473.2, cy: 10.0, fy: "FY 2022", value: "$920k", trend: "up", underlineLeft: 468, labelIndex: 6 },
    ],
    bars: [
      { id: "b1", value: "7.2%", height: 125, line1: "subject", line2: "property", spacer: false, fadedValue: false, diff: "Subject Property (+1.8%)" },
      { id: "b2", value: "5.4%", height: 95, line1: "residential", line2: "benchmark", spacer: false, fadedValue: false, diff: "Metro Benchmark (-1.8%)" },
      { id: "b3", value: "5.5%", height: 96, line1: "ASX 200", line2: "index", spacer: true, fadedValue: false, diff: "Equities (-1.7%)" },
      { id: "b4", value: "3.8%", height: 68, line1: "CPI", line2: "inflation", spacer: false, fadedValue: true, diff: "Inflation (-3.4%)" },
    ],
  },
  "Total Loans": {
    waveTitle: "Debt Balance & Amortization Trend",
    waveSubtitle:
      "Outstanding loan principal and debt amortization across financial years",
    benchmarkTitle: "Borrowing Rate Comparison",
    points: [
      { id: 0, cx: 9.4, cy: 18.0, fy: "FY 2021", value: "$720k", trend: "down", underlineLeft: 10, labelIndex: 0 },
      { id: 1, cx: 85.8, cy: 28.0, fy: "FY 2022", value: "$705k", trend: "down", underlineLeft: 86, labelIndex: 1 },
      { id: 2, cx: 163.8, cy: 39.0, fy: "FY 2023", value: "$690k", trend: "down", underlineLeft: 163, labelIndex: 2 },
      { id: 3, cx: 240.8, cy: 52.0, fy: "FY 2024", value: "$670k", trend: "down", underlineLeft: 239, labelIndex: 3 },
      { id: 4, cx: 266.8, cy: 64.7, fy: "FY 2024", value: "$650k", trend: "down", underlineLeft: 268.6, labelIndex: 3 },
      { id: 5, cx: 317.8, cy: 75.0, fy: "FY 2025", value: "$625k", trend: "down", underlineLeft: 315, labelIndex: 4 },
      { id: 6, cx: 396.1, cy: 88.0, fy: "FY 2026", value: "$595k", trend: "down", underlineLeft: 392, labelIndex: 5 },
      { id: 7, cx: 473.2, cy: 98.0, fy: "FY 2022", value: "$560k", trend: "down", underlineLeft: 468, labelIndex: 6 },
    ],
    bars: [
      { id: "b1", value: "6.24%", height: 112, line1: "current", line2: "loan rate", spacer: false, fadedValue: false, diff: "Current Interest Rate" },
      { id: "b2", value: "6.50%", height: 118, line1: "standard", line2: "variable", spacer: false, fadedValue: false, diff: "Standard Variable (+0.26%)" },
      { id: "b3", value: "5.85%", height: 102, line1: "prime", line2: "market", spacer: false, fadedValue: false, diff: "Prime Refinance (-0.39%)" },
      { id: "b4", value: "4.35%", height: 75, line1: "RBA cash", line2: "rate", spacer: false, fadedValue: true, diff: "Cash Rate (-1.89%)" },
    ],
  },
  "Total Equity": {
    waveTitle: "Net Equity Accumulation Trend",
    waveSubtitle:
      "Compounded equity and borrowing buffer across financial years",
    benchmarkTitle: "Equity Return on Equity (ROE)",
    points: [
      { id: 0, cx: 9.4, cy: 98.0, fy: "FY 2021", value: "$40k", trend: "up", underlineLeft: 10, labelIndex: 0 },
      { id: 1, cx: 85.8, cy: 85.0, fy: "FY 2022", value: "$65k", trend: "up", underlineLeft: 86, labelIndex: 1 },
      { id: 2, cx: 163.8, cy: 70.0, fy: "FY 2023", value: "$95k", trend: "up", underlineLeft: 163, labelIndex: 2 },
      { id: 3, cx: 240.8, cy: 55.0, fy: "FY 2024", value: "$125k", trend: "up", underlineLeft: 239, labelIndex: 3 },
      { id: 4, cx: 266.8, cy: 40.0, fy: "FY 2024", value: "$150k", trend: "up", underlineLeft: 268.6, labelIndex: 3 },
      { id: 5, cx: 317.8, cy: 28.0, fy: "FY 2025", value: "$190k", trend: "up", underlineLeft: 315, labelIndex: 4 },
      { id: 6, cx: 396.1, cy: 16.0, fy: "FY 2026", value: "$245k", trend: "up", underlineLeft: 392, labelIndex: 5 },
      { id: 7, cx: 473.2, cy: 10.0, fy: "FY 2022", value: "$290k", trend: "up", underlineLeft: 468, labelIndex: 6 },
    ],
    bars: [
      { id: "b1", value: "8.4%", height: 136, line1: "equity", line2: "ROE", spacer: false, fadedValue: false, diff: "Equity ROE (+1.6%)" },
      { id: "b2", value: "6.8%", height: 112, line1: "portfolio", line2: "average", spacer: false, fadedValue: false, diff: "Portfolio Average (-1.6%)" },
      { id: "b3", value: "7.5%", height: 122, line1: "super", line2: "benchmark", spacer: false, fadedValue: false, diff: "Balanced Super (-0.9%)" },
      { id: "b4", value: "4.8%", height: 80, line1: "term", line2: "deposit", spacer: false, fadedValue: true, diff: "Term Deposit (-3.6%)" },
    ],
  },
  "Total Property Return": {
    waveTitle: "Net Yield History & Trend",
    waveSubtitle:
      "Annual net operating yield after all property outgoings across financial years",
    benchmarkTitle: "Benchmark comparison",
    points: NET_YIELD_POINTS,
    bars: BENCHMARK_BARS,
  },
  "LVR (Loan-to-Value Ratio)": {
    waveTitle: "LVR Trajectory & De-risking Trend",
    waveSubtitle:
      "Loan-to-value ratio improvement across financial years",
    benchmarkTitle: "LVR Lending Safety Benchmarks",
    points: [
      { id: 0, cx: 9.4, cy: 22.0, fy: "FY 2021", value: "92.0%", trend: "down", underlineLeft: 10, labelIndex: 0 },
      { id: 1, cx: 85.8, cy: 32.0, fy: "FY 2022", value: "89.5%", trend: "down", underlineLeft: 86, labelIndex: 1 },
      { id: 2, cx: 163.8, cy: 45.0, fy: "FY 2023", value: "86.0%", trend: "down", underlineLeft: 163, labelIndex: 2 },
      { id: 3, cx: 240.8, cy: 56.0, fy: "FY 2024", value: "83.5%", trend: "down", underlineLeft: 239, labelIndex: 3 },
      { id: 4, cx: 266.8, cy: 64.7, fy: "FY 2024", value: "81.25%", trend: "down", underlineLeft: 268.6, labelIndex: 3 },
      { id: 5, cx: 317.8, cy: 76.0, fy: "FY 2025", value: "77.0%", trend: "down", underlineLeft: 315, labelIndex: 4 },
      { id: 6, cx: 396.1, cy: 90.0, fy: "FY 2026", value: "71.5%", trend: "down", underlineLeft: 392, labelIndex: 5 },
      { id: 7, cx: 473.2, cy: 98.0, fy: "FY 2022", value: "66.0%", trend: "down", underlineLeft: 468, labelIndex: 6 },
    ],
    bars: [
      { id: "b1", value: "81.2%", height: 135, line1: "subject", line2: "LVR", spacer: false, fadedValue: false, diff: "Current Gearing Level" },
      { id: "b2", value: "80.0%", height: 130, line1: "no-LMI", line2: "cap", spacer: false, fadedValue: false, diff: "LMI Waiver Threshold (-1.2%)" },
      { id: "b3", value: "70.0%", height: 114, line1: "target", line2: "safe tier", spacer: false, fadedValue: false, diff: "Target Safe Tier (-11.2%)" },
      { id: "b4", value: "60.0%", height: 96, line1: "conservative", line2: "LVR", spacer: false, fadedValue: true, diff: "Conservative Tier (-21.2%)" },
    ],
  },
};

const DEFAULT_METRIC_INSIGHTS: Record<string, ReviewInsightItem[]> = {
  "Property Value": [
    {
      id: "df-val-1",
      fy: "2024",
      screen: "Property Analysis",
      property: "17 Learmonth Street",
      metric: "Valuation",
      heading: "Property Valuation Review",
      insight:
        "The property's current valuation should be reviewed against its previous valuation.",
      recommendation:
        "Verify the latest valuation and record the review date and source to unlock usable equity.",
      priority: "High",
    },
    {
      id: "df-val-2",
      fy: "2024",
      screen: "Property Analysis",
      property: "17 Learmonth Street",
      metric: "Capital Growth",
      heading: "Capital Growth Performance",
      insight:
        "Compound capital appreciation has tracked at 5.2% p.a., slightly outperforming the metro benchmark.",
      recommendation:
        "Maintain buy-and-hold stance while reviewing local zoning uplift potentials.",
      priority: "Medium",
    },
    {
      id: "df-val-3",
      fy: "2024",
      screen: "Property Analysis",
      property: "17 Learmonth Street",
      metric: "Valuation",
      heading: "Building Depreciation & Write-Down",
      insight:
        "Existing depreciation schedule is nearing end of plant and equipment deduction lifespan.",
      recommendation:
        "Commission updated tax depreciation quantity surveyor report to maximise tax write-offs.",
      priority: "Low",
    },
  ],
  "Total Loans": [
    {
      id: "df-loan-1",
      fy: "2024",
      screen: "Property Analysis",
      property: "17 Learmonth Street",
      metric: "Total Loans",
      heading: "Loan Pricing & Interest Rate Review",
      insight:
        "Current lending rate of 6.24% p.a. is 39 bps higher than prime tier refinance offers in market.",
      recommendation:
        "Request lender pricing retention concession or prepare refinance application to save $2,500/yr.",
      priority: "High",
    },
    {
      id: "df-loan-2",
      fy: "2024",
      screen: "Property Analysis",
      property: "17 Learmonth Street",
      metric: "Debt Management",
      heading: "Interest-Only Expiry Buffer",
      insight:
        "Interest-only period transitions to principal & interest in Nov 2027, increasing monthly repayments.",
      recommendation:
        "Model cash-flow impact and apply to roll IO period for another 5 years 6 months prior.",
      priority: "Medium",
    },
    {
      id: "df-loan-3",
      fy: "2024",
      screen: "Property Analysis",
      property: "17 Learmonth Street",
      metric: "Total Loans",
      heading: "Offset Account Cash Optimization",
      insight:
        "Cash reserves in external savings are generating taxable interest rather than non-taxable debt offset.",
      recommendation:
        "Direct all surplus liquidity into 100% mortgage offset account to accelerate interest reduction.",
      priority: "Low",
    },
  ],
  "Total Equity": [
    {
      id: "df-eq-1",
      fy: "2024",
      screen: "Property Analysis",
      property: "17 Learmonth Street",
      metric: "Equity",
      heading: "Usable Equity Extraction",
      insight:
        "Accumulated net equity of $150,000 gives capacity for an equity release facility.",
      recommendation:
        "Establish standby revolving line of credit or split loan for portfolio liquidity reserves.",
      priority: "High",
    },
    {
      id: "df-eq-2",
      fy: "2024",
      screen: "Property Analysis",
      property: "17 Learmonth Street",
      metric: "Equity",
      heading: "Cross-Collateralisation De-linking",
      insight:
        "Property loans remain tied to single lender security bundle, limiting independent refinancing flexibility.",
      recommendation:
        "Uncross securities at next refinance to isolate capital risk between family home and investments.",
      priority: "Medium",
    },
    {
      id: "df-eq-3",
      fy: "2024",
      screen: "Property Analysis",
      property: "17 Learmonth Street",
      metric: "Equity",
      heading: "Equity Return on Investment (ROE)",
      insight:
        "Return on invested equity is currently 8.4%, supporting strong compounding leverage.",
      recommendation:
        "Continue compound wealth accrual without prematurely selling assets in high growth phase.",
      priority: "Low",
    },
  ],
  "Total Property Return": [
    {
      id: "df-ret-1",
      fy: "2024",
      screen: "Property Analysis",
      property: "17 Learmonth Street",
      metric: "Rental Income",
      heading: "Rental Income Review",
      insight:
        "Current rental income may differ from the local market rent benchmark.",
      recommendation:
        "Review the current rent against the relevant market benchmark.",
      priority: "High",
    },
    {
      id: "df-ret-2",
      fy: "2024",
      screen: "Property Analysis",
      property: "17 Learmonth Street",
      metric: "Valuation",
      heading: "Property Valuation Review",
      insight:
        "The property's current valuation should be reviewed against its previous valuation.",
      recommendation:
        "Verify the latest valuation and record the review date and source.",
      priority: "High",
    },
    {
      id: "df-ret-3",
      fy: "2024",
      screen: "Property Analysis",
      property: "17 Learmonth Street",
      metric: "Operating Expenses",
      heading: "Reduce Operating Expenses",
      insight:
        "Property operating expenses should be reviewed against available records and relevant benchmarks.",
      recommendation:
        "Review insurance premiums, property management fees and maintenance costs for potential savings.",
      priority: "Medium",
    },
  ],
  "LVR (Loan-to-Value Ratio)": [
    {
      id: "df-lvr-1",
      fy: "2024",
      screen: "Property Analysis",
      property: "17 Learmonth Street",
      metric: "LVR",
      heading: "LMI Elimination Threshold",
      insight:
        "LVR of 81.25% is within 1.25% of the 80% threshold where Lenders Mortgage Insurance is eliminated.",
      recommendation:
        "Make small lump sum principal reduction of $10,000 to drop LVR under 80% and unlock lower tier rates.",
      priority: "High",
    },
    {
      id: "df-lvr-2",
      fy: "2024",
      screen: "Property Analysis",
      property: "17 Learmonth Street",
      metric: "LVR",
      heading: "Portfolio Risk Exposure Review",
      insight:
        "Combined household gearing is stabilizing as asset appreciation outpaces debt expansion.",
      recommendation:
        "Target medium-term debt reduction to reach comfortable sub-65% LVR by FY2028.",
      priority: "Medium",
    },
    {
      id: "df-lvr-3",
      fy: "2024",
      screen: "Property Analysis",
      property: "17 Learmonth Street",
      metric: "LVR",
      heading: "Valuation Uplift Re-assessment",
      insight:
        "A current bank valuation re-assessment may naturally compress LVR below 80% without cash injection.",
      recommendation:
        "Order automated valuation model (AVM) or desktop bank valuation through broker.",
      priority: "Low",
    },
  ],
};

export default function ReviewWorkspaceReport({
  householdId = "",
  reviewId = "",
  dbHousehold,
  onDataChanged,
  householdName = "Harrison Household",
  reviewYear = "2026",
  reviewStatus = "In Progress",
  readOnly = false,
  onBack,
  initialTab = "executive-summary",
}: ReviewWorkspaceReportProps) {
  const [activeTab, setActiveTab] = useState<
    | "executive-summary"
    | "portfolio-overview"
    | "property-analysis"
    | "future-outlook"
    | "insights"
  >(initialTab);

  const activeReview = useMemo(() => {
    if (!dbHousehold || !Array.isArray(dbHousehold.reviews)) return null;
    return (
      dbHousehold.reviews.find((r: any) => r.id === reviewId) ||
      dbHousehold.reviews.find(
        (r: any) => String(r.financialYear) === String(reviewYear)
      ) ||
      dbHousehold.reviews[0] ||
      null
    );
  }, [dbHousehold, reviewId, reviewYear]);

  const effectiveReviewId = reviewId || activeReview?.id || "";

interface ReviewPropertyCard {
  id: string;
  badge: string;
  address: string;
  subtitle: string;
  image: string;
  beds: number;
  baths: number;
  area: number;
  garages: number;
  purchasePrice: string;
  purchaseDate: string;
  owners: string[];
  propertyValue: string;
  totalLoans: string;
  totalEquity: string;
  totalReturn: string;
  lvr: string;
  rawValue: number;
  rawLoans: number;
  rawEquity: number;
  isOwnerOccupied: boolean;
  rawWkRent?: number;
  rawGrossRent?: number;
  rawExpenses?: number;
  rawDebtService?: number;
  rawNetCashFlow?: number;
  rawNetYield?: number;
  rawPurchasePrice?: number;
  rawGrowthPct?: number;
  yieldPct?: number;
  propertyCategory?: string;
  loans?: any[];
}

  // Dynamically map properties from dbHousehold
  const propertiesList = useMemo<ReviewPropertyCard[]>(() => {
    const rawProps = Array.isArray(dbHousehold?.properties)
      ? dbHousehold.properties
      : [];
    if (rawProps.length === 0) {
      return [
        {
          id: "empty-prop",
          badge: "Property 0 Of 0",
          address: "No Properties Added Yet",
          subtitle: "Add a property in Properties & Loans Setup",
          image: "/images/review/4898a.png",
          beds: 0,
          baths: 0,
          area: 0,
          garages: 0,
          purchasePrice: "$0",
          purchaseDate: "-",
          owners: ["Primary Owner 100%"],
          propertyValue: "$0",
          totalLoans: "$0",
          totalEquity: "$0",
          totalReturn: "0.00%",
          lvr: "0.00%",
          rawValue: 0,
          rawLoans: 0,
          rawEquity: 0,
          isOwnerOccupied: false,
        },
      ];
    }

    const totalCount = rawProps.length;
    const revSnaps = Array.isArray(activeReview?.propertySnapshots)
      ? activeReview.propertySnapshots
      : [];
    const loanSnaps = Array.isArray(activeReview?.loanSnapshots)
      ? activeReview.loanSnapshots
      : [];

    return rawProps.map((p: any, idx: number) => {
      const pSnap =
        revSnaps.find(
          (s: any) => s.propertyId === p.id && s.snapshotPoint === "REVIEW_DATE"
        ) ||
        revSnaps.find((s: any) => s.propertyId === p.id) ||
        (p.snapshots || [])[0];

      const val = Number(
        pSnap?.valuation ?? p.currentValuation ?? p.purchasePrice ?? 0
      );
      let loansTotal = 0;
      for (const l of p.loans || []) {
        const lSnap =
          loanSnaps.find(
            (s: any) => s.loanId === l.id && s.snapshotPoint === "REVIEW_DATE"
          ) ||
          loanSnaps.find((s: any) => s.loanId === l.id) ||
          (l.snapshots || [])[0];
        loansTotal += Number(lSnap?.loanBalance ?? 0);
      }

      const equity = Math.max(0, val - loansTotal);
      const lvrNum = val > 0 ? (loansTotal / val) * 100 : 0;
      const purchasePriceNum = Number(p.purchasePrice ?? 0);
      const growthPct =
        purchasePriceNum > 0
          ? (((val - purchasePriceNum) / purchasePriceNum) * 100) / 5
          : 5.4;
      const wkRent = Number(pSnap?.weeklyRent ?? p.weeklyRent ?? 0);
      const grossRent = wkRent * 52;
      const expenses =
        Number(pSnap?.councilRates ?? 0) +
        Number(pSnap?.waterRates ?? 0) +
        Number(pSnap?.insurance ?? 0) +
        Number(pSnap?.repairsMaintenance ?? 0) +
        Number(pSnap?.strataFees ?? 0) +
        Number(pSnap?.landTax ?? 0) +
        Number(pSnap?.propertyManagementFees ?? 0) +
        Number(pSnap?.otherExpenses ?? 0);
      const finalExpenses =
        expenses > 0 ? expenses : Math.round(grossRent * 0.18);
      const pDebtService = Math.round(loansTotal * 0.0594);
      const pNetCashFlow = grossRent - finalExpenses - pDebtService;
      const pNetYield = val > 0 ? ((grossRent - finalExpenses) / val) * 100 : 0;
      const yieldPct = val > 0 ? (grossRent / val) * 100 : 0;
      const totalReturnNum = Math.max(0, growthPct + yieldPct);

      const owners: string[] = [];
      if (p.owner1 && p.owner1 !== "----") {
        owners.push(`${p.owner1} ${p.owner1Pct || "100%"}`);
      }
      if (p.owner2 && p.owner2 !== "----" && p.owner2 !== "None") {
        owners.push(`${p.owner2} ${p.owner2Pct || ""}`);
      }
      if (owners.length === 0) {
        owners.push("Primary Owner 100%");
      }

      const isOO = p.type === "OWNER_OCCUPIED";

      return {
        id: p.id,
        badge: `Property ${idx + 1} Of ${totalCount}`,
        address: p.address,
        subtitle: `${
          isOO ? "Owner-Occupied Property" : "Investment Property"
        }  | ${p.propertyCategory || "House"}`,
        image: "/images/review/4898a.png",
        beds: Number(p.beds ?? 4),
        baths: Number(p.baths ?? 2),
        area: Number(String(p.landSize || "600").replace(/[^0-9]/g, "")) || 600,
        garages: Number(p.cars ?? 2),
        purchasePrice: fmtMoney(p.purchasePrice),
        purchaseDate: p.purchaseDateStr || "24/10/2026",
        owners,
        propertyValue: fmtMoney(val),
        totalLoans: fmtMoney(loansTotal),
        totalEquity: fmtMoney(equity),
        totalReturn: `${totalReturnNum.toFixed(2)}%`,
        lvr: `${lvrNum.toFixed(2)}%`,
        rawValue: val,
        rawLoans: loansTotal,
        rawEquity: equity,
        rawWkRent: wkRent,
        rawGrossRent: grossRent,
        rawExpenses: finalExpenses,
        rawDebtService: pDebtService,
        rawNetCashFlow: pNetCashFlow,
        rawNetYield: pNetYield,
        rawPurchasePrice: purchasePriceNum,
        rawGrowthPct: growthPct,
        yieldPct: yieldPct,
        propertyCategory: p.propertyCategory || "House",
        loans: p.loans || [],
        isOwnerOccupied: isOO,
      };
    });
  }, [dbHousehold, activeReview]);

  // Executive Summary editable states (synced with DB)
  const [verdictText, setVerdictText] = useState(
    "The property portfolio continues to demonstrate strong capital resilience. Review mortgage structuring and rental yield optimization to strengthen net cash flow."
  );
  const [isEditingVerdict, setIsEditingVerdict] = useState(false);

  const [objectiveText, setObjectiveText] = useState(
    "Achieve $120,000 p.a. in net passive cash flow from unencumbered residential property assets by FY2035, while maintaining loan-to-value ratios below 50%."
  );
  const [isEditingObjective, setIsEditingObjective] = useState(false);

  const [portfolioCommentary, setPortfolioCommentary] = useState("");
  const [propertyCommentary, setPropertyCommentary] = useState("");
  const [bottomLineText, setBottomLineText] = useState(
    "Your portfolio is performing well, and with three focused actions, can deliver your retirement income goal...."
  );

  const defaultExecData: ExecutiveSummaryData = useMemo(
    () => ({
      totalReturnVal: "6.8%",
      totalReturnSub: `Total Return (FY${reviewYear || 2026})`,
      metricCards: [
        {
          title: "Cash Return on Equity",
          val: "-2.9%",
          comp: `12.4% vs FY${Number(reviewYear || 2026) - 1}`,
        },
        {
          title: "After-Tax Cash Flow",
          val: "-$69,074",
          comp: `12.4% vs FY${Number(reviewYear || 2026) - 1}`,
        },
        {
          title: "Cash Cover",
          val: "18.4 Months",
          comp: "Buffer: $130,000",
        },
        {
          title: "Average Interest Rate",
          val: "5.97%",
          comp: `12.4% vs FY${Number(reviewYear || 2026) - 1}`,
        },
      ],
      opportunities: [
        {
          title: "01. Refinance higher-rate loans",
          desc: "Four loans are above market rates by ~0.7%.",
          amount: "$15,100 p.a.",
        },
        {
          title: "02. Reduce property management costs",
          desc: "Ocean Drive costs ~28% above comparable properties.",
          amount: "$2,400 p.a.",
        },
        {
          title: "03. Review and reset rents",
          desc: "Park Avenue rent has not been reviewed in 26 months.",
          amount: "$2,080 p.a.",
        },
      ],
      risks: [
        {
          title: "Interest-rate exposure",
          desc: "45% of loans are variable, increasing sensitivity to rate rises.",
        },
        {
          title: "Property performance risk",
          desc: "One property is underperforming and its strategic role should be reviewed.",
        },
        {
          title: "Income concentration",
          desc: "All income is from residential property, with limited diversification across assets.",
        },
      ],
      trackGoal: "$120,000 p.a.",
      trackCurrentPathVal: "$112,000",
      trackActionsVal: "$132,000",
      trackNarrative:
        "With the identified actions, your portfolio could provide around $132,000 p.a. in 20 years, above your $120,000 target.",
      initiatives: [
        {
          title: "1. Optimise portfolio cash flow",
          desc: "– refinance, insurance and property costs.",
        },
        {
          title: "2. Assess the Park Avenue strategy",
          desc: "– hold, improve or redeploy the capital.",
        },
        {
          title: "3. Confirm the debt reduction plan",
          desc: "– ensure it keeps you on track for $120,000 p.a.",
        },
      ],
      propertyStrategicRoles: {},
    }),
    [reviewYear]
  );

  const [execData, setExecData] =
    useState<ExecutiveSummaryData>(defaultExecData);
  const [isEditingAllExec, setIsEditingAllExec] = useState(false);
  const [isEditingMetrics, setIsEditingMetrics] = useState(false);
  const [isEditingOpps, setIsEditingOpps] = useState(false);
  const [isEditingRisks, setIsEditingRisks] = useState(false);
  const [isEditingTrack, setIsEditingTrack] = useState(false);
  const [isEditingInitiatives, setIsEditingInitiatives] = useState(false);
  const canEdit = !readOnly;

  // Review status interactive state
  const [reviewStatusState, setReviewStatusState] = useState<
    "Completed" | "In Progress"
  >(reviewStatus === "Completed" ? "Completed" : "In Progress");
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);

  const updateExecData = (patch: Partial<ExecutiveSummaryData>) => {
    setExecData((prev) => {
      const next = { ...prev, ...patch };
      persistReviewField({ executiveSummary: JSON.stringify(next) });
      return next;
    });
  };

  const handleSetStatus = async (newStatus: "Completed" | "In Progress") => {
    setReviewStatusState(newStatus);
    setIsStatusMenuOpen(false);
    try {
      if (newStatus === "Completed") {
        await completeReviewApi(effectiveReviewId);
      } else {
        await reopenReviewApi(effectiveReviewId);
      }
      await onDataChanged?.();
    } catch (err) {
      console.warn("completeReviewApi/reopenReviewApi fell back to updateReviewApi:", err);
      try {
        await persistReviewField({
          tchReviewStatus: newStatus === "Completed" ? "COMPLETED" : "IN_PROGRESS",
        });
        await onDataChanged?.();
      } catch (fallbackErr) {
        console.error("Failed to update review status:", fallbackErr);
      }
    }
  };

  // Live System Settings Benchmarks for Chart Associations & Global Assumptions
  const [systemBenchmarks, setSystemBenchmarks] = useState<any[]>([]);
  const [globalAssumptions, setGlobalAssumptions] =
    useState<FutureOutlookGlobalAssumptions>(
      getCachedFutureOutlookAssumptions()
    );

  useEffect(() => {
    let isMounted = true;
    fetchSystemSettingsApi()
      .then((res) => {
        if (isMounted && res?.benchmarks && Array.isArray(res.benchmarks)) {
          setSystemBenchmarks(res.benchmarks);
        }
        if (isMounted && res?.futureOutlookAssumptions) {
          setGlobalAssumptions(res.futureOutlookAssumptions);
        }
      })
      .catch((err) => {
        console.warn("Could not load system settings benchmarks for charts:", err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Interactive Metric Selection & Bottom Insights Carousel for Report Screens
  const [selectedMetric, setSelectedMetric] = useState<string>("Total Property Return");
  const [carouselIndex, setCarouselIndex] = useState<number>(0);

  const handleSelectMetric = (metricName: string) => {
    setSelectedMetric(metricName);
    setCarouselIndex(0);
  };

  // Tab 2: Portfolio Overview sub-tab
  const [portfolioSubTab, setPortfolioSubTab] = useState<
    "Summary" | "Property" | "Equity" | "Cash"
  >("Summary");

  // Tab 3: Property Analysis states
  const [selectedPropertyIndex, setSelectedPropertyIndex] = useState(0);
  const [isPropertyDropdownOpen, setIsPropertyDropdownOpen] = useState(false);
  const [propertySubView, setPropertySubView] = useState<
    "overview" | "cash-management" | "capital-management"
  >("overview");
  const [cashSubTab, setCashSubTab] = useState<
    "cash-performance" | "operational-efficiency"
  >("cash-performance");
  const [capitalSubTab, setCapitalSubTab] = useState<
    "asset-performance" | "debt-management"
  >("asset-performance");
  const [selectedLoanTab, setSelectedLoanTab] = useState<
    "Loan 1" | "Loan 2" | "Loan 3"
  >("Loan 1");

  // Tab 4: Interactive Future Outlook states
  const [activeScenario, setActiveScenario] = useState<"a" | "b">("a");
  const [copiedToWhatIf, setCopiedToWhatIf] = useState<boolean>(false);

  const [forecastHorizon, setForecastHorizon] = useState<number>(20);
  const [homeGrowthRate, setHomeGrowthRate] = useState<number>(3.0);
  const [homeExtraRepayment, setHomeExtraRepayment] = useState<number>(800);
  const [homeDownsizerPrice, setHomeDownsizerPrice] = useState<number>(250);

  const [invGrowthRate, setInvGrowthRate] = useState<number>(6.0);
  const [invNetYield, setInvNetYield] = useState<number>(3.5);
  const [invExtraRepayment, setInvExtraRepayment] = useState<number>(1250);
  const [invAddlInvestment, setInvAddlInvestment] = useState<number>(0);

  const [superReturnRate, setSuperReturnRate] = useState<number>(6.0);
  const [superExtraContrib, setSuperExtraContrib] = useState<number>(1250);
  const [incomeGoal, setIncomeGoal] = useState<number>(60000);
  const [chartHoverYear, setChartHoverYear] = useState<number | null>(null);

  // Scenario B Levers (What If)
  const [scenarioBLevers, setScenarioBLevers] = useState({
    forecastHorizon: 20,
    homeGrowthRate: 3.2,
    homeExtraRepayment: 1000,
    homeDownsizerPrice: 250,
    invGrowthRate: 6.4,
    invNetYield: 3.8,
    invExtraRepayment: 1500,
    invAddlInvestment: 0,
    superReturnRate: 6.2,
    superExtraContrib: 1500,
    incomeGoal: 60000,
  });

  const activeLevers = useMemo(() => {
    return activeScenario === "a"
      ? {
          forecastHorizon,
          homeGrowthRate,
          homeExtraRepayment,
          homeDownsizerPrice,
          invGrowthRate,
          invNetYield,
          invExtraRepayment,
          invAddlInvestment,
          superReturnRate,
          superExtraContrib,
          incomeGoal,
        }
      : scenarioBLevers;
  }, [
    activeScenario,
    forecastHorizon,
    homeGrowthRate,
    homeExtraRepayment,
    homeDownsizerPrice,
    invGrowthRate,
    invNetYield,
    invExtraRepayment,
    invAddlInvestment,
    superReturnRate,
    superExtraContrib,
    incomeGoal,
    scenarioBLevers,
  ]);

  const updateActiveLever = (field: string, val: number) => {
    if (activeScenario === "a") {
      if (field === "forecastHorizon") setForecastHorizon(val);
      else if (field === "homeGrowthRate") setHomeGrowthRate(val);
      else if (field === "homeExtraRepayment") setHomeExtraRepayment(val);
      else if (field === "homeDownsizerPrice") setHomeDownsizerPrice(val);
      else if (field === "invGrowthRate") setInvGrowthRate(val);
      else if (field === "invNetYield") setInvNetYield(val);
      else if (field === "invExtraRepayment") setInvExtraRepayment(val);
      else if (field === "invAddlInvestment") setInvAddlInvestment(val);
      else if (field === "superReturnRate") setSuperReturnRate(val);
      else if (field === "superExtraContrib") setSuperExtraContrib(val);
      else if (field === "incomeGoal") setIncomeGoal(val);
    } else {
      setScenarioBLevers((prev) => ({ ...prev, [field]: val }));
    }
  };

  const handleCopyPlanToWhatIf = () => {
    setScenarioBLevers({
      forecastHorizon,
      homeGrowthRate,
      homeExtraRepayment,
      homeDownsizerPrice,
      invGrowthRate,
      invNetYield,
      invExtraRepayment,
      invAddlInvestment,
      superReturnRate,
      superExtraContrib,
      incomeGoal,
    });
    setCopiedToWhatIf(true);
    setTimeout(() => setCopiedToWhatIf(false), 2500);
  };

  // Tab 5: Portfolio Management Insights states (loaded from DB)
  const [insights, setInsights] = useState<ReviewInsightItem[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<
    "All" | "High" | "Medium" | "Low"
  >("All");
  const [propertyFilter, setPropertyFilter] = useState<string>("All");
  const [yearFilter, setYearFilter] = useState<string>("All");
  const [isPropertyHeaderMenuOpen, setIsPropertyHeaderMenuOpen] = useState(false);

  // Add & Review Insight Modal states
  const [isAddInsightOpen, setIsAddInsightOpen] = useState(false);
  const [currentInsightIndex, setCurrentInsightIndex] = useState(0);
  const [editingInsightId, setEditingInsightId] = useState<string | null>(null);
  const [insightSaveMsg, setInsightSaveMsg] = useState("");
  const [isSubmittingInsight, setIsSubmittingInsight] = useState(false);
  const [newInsightFy, setNewInsightFy] = useState<string>(String(reviewYear || 2026));
  const [newInsightProperty, setNewInsightProperty] = useState("Portfolio-Wide");
  const [newInsightMetric, setNewInsightMetric] = useState("Rental Income");
  const [newInsightHeading, setNewInsightHeading] = useState("");
  const [newInsightObservation, setNewInsightObservation] = useState("");
  const [newInsightRecommendation, setNewInsightRecommendation] = useState("");
  const [newInsightPriority, setNewInsightPriority] = useState<
    "High" | "Medium" | "Low"
  >("High");
  const [newInsightOwner, setNewInsightOwner] = useState("Adviser");
  const [newInsightAction, setNewInsightAction] = useState("");
  const [newInsightNotes, setNewInsightNotes] = useState("");

  // Sync Executive Summary & Insights from DB whenever activeReview or dbHousehold changes
  useEffect(() => {
    if (activeReview) {
      if (activeReview.verdictText) setVerdictText(activeReview.verdictText);
      if (activeReview.objectiveText)
        setObjectiveText(activeReview.objectiveText);
      else if (dbHousehold?.notes) setObjectiveText(dbHousehold.notes);
      if (activeReview.portfolioCommentary)
        setPortfolioCommentary(activeReview.portfolioCommentary);
      if (activeReview.propertyCommentary)
        setPropertyCommentary(activeReview.propertyCommentary);
      if (activeReview.bottomLineText)
        setBottomLineText(activeReview.bottomLineText);
      if (activeReview.futureOutlook?.forecastYears) {
        setForecastHorizon(Number(activeReview.futureOutlook.forecastYears));
      }
      if (activeReview.tchReviewStatus === "COMPLETED") {
        setReviewStatusState("Completed");
      } else {
        setReviewStatusState("In Progress");
      }
      if (activeReview.executiveSummary) {
        try {
          const parsed = JSON.parse(activeReview.executiveSummary);
          if (parsed && typeof parsed === "object") {
            setExecData((prev) => ({ ...prev, ...parsed }));
          }
        } catch {
          // ignore
        }
      }
    } else if (reviewStatus) {
      setReviewStatusState(reviewStatus);
    }

    // Collect insights across reviews from DB
    const loadedInsights: ReviewInsightItem[] = [];
    if (Array.isArray(dbHousehold?.reviews)) {
      for (const r of dbHousehold.reviews) {
        for (const c of r.criteria || []) {
          const pRaw = String(c.priority || "MEDIUM").toUpperCase();
          const prio: "High" | "Medium" | "Low" =
            pRaw === "HIGH" ? "High" : pRaw === "LOW" ? "Low" : "Medium";
          loadedInsights.push({
            id: c.id,
            reviewId: r.id,
            fy: String(r.financialYear),
            screen: c.screen || "Property Analysis",
            property: c.propertyName || "Portfolio-Wide",
            maintenanceInsight: c.maintenanceInsight || "-",
            metric: c.metric || "Rental Income",
            heading: c.criterionTitle || "Review Insight",
            insight: c.insight || "-",
            recommendation: c.recommendation || "-",
            priority: prio,
            owner: c.owner || "Adviser",
            action: c.action || "Review",
            notes: c.adviserNotes || "-",
          });
        }
      }
    }
    setInsights(loadedInsights);
  }, [activeReview, dbHousehold]);

  const persistReviewField = async (patch: Record<string, any>) => {
    if (!effectiveReviewId) return;
    try {
      await updateReviewApi(effectiveReviewId, patch);
      await onDataChanged?.();
    } catch (err) {
      console.error("Failed to save review field:", err);
    }
  };

  // Hover states for interactive charts
  const [hoveredYieldPointIndex, setHoveredYieldPointIndex] = useState<
    number | null
  >(null);
  const [hoveredBenchmarkBarId, setHoveredBenchmarkBarId] = useState<
    string | null
  >(null);
  const [hoveredExecBenchmark, setHoveredExecBenchmark] = useState<
    string | null
  >(null);
  const [hoveredTrackPath, setHoveredTrackPath] = useState<
    "current" | "actions" | null
  >(null);

  const currentProperty =
    propertiesList[selectedPropertyIndex] || propertiesList[0];

  // Helper to determine the contextual default property & metric based on screen & subview
  const getContextualDefaults = () => {
    let defaultProp = "Portfolio-Wide";
    let defaultMet = "Rental Income";

    if (activeTab === "property-analysis") {
      defaultProp =
        currentProperty?.address ||
        (propertiesList[0]?.address ?? "Portfolio-Wide");
      if (propertySubView === "cash-management") {
        defaultMet =
          cashSubTab === "operational-efficiency"
            ? "Operating Expenses"
            : "Rental Income";
      } else if (propertySubView === "capital-management") {
        defaultMet =
          capitalSubTab === "debt-management"
            ? "Debt & Refinancing"
            : "Capital Growth";
      } else {
        defaultMet = "Valuation";
      }
    } else if (activeTab === "portfolio-overview") {
      defaultProp = "Portfolio-Wide";
      if (portfolioSubTab === "Property") {
        defaultMet = "Rental Income";
      } else if (portfolioSubTab === "Equity") {
        defaultMet = "Debt & Refinancing";
      } else if (portfolioSubTab === "Cash") {
        defaultMet = "Operating Expenses";
      } else {
        defaultMet = "Valuation";
      }
    } else if (activeTab === "future-outlook") {
      defaultProp = "Portfolio-Wide";
      defaultMet = "Capital Growth";
    } else {
      defaultProp = "Portfolio-Wide";
      defaultMet = "Valuation";
    }

    return { defaultProp, defaultMet };
  };

  const availableYears = useMemo(() => {
    const years = new Set<string>(["2024", "2025", "2026"]);
    if (reviewYear) years.add(String(reviewYear));
    if (Array.isArray(dbHousehold?.reviews)) {
      dbHousehold.reviews.forEach((r: any) => {
        if (r.financialYear) years.add(String(r.financialYear));
      });
    }
    insights.forEach((i) => {
      if (i.fy) years.add(String(i.fy));
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [dbHousehold, reviewYear, insights]);

  const availableProperties = useMemo(() => {
    const props = new Set<string>();
    props.add("Portfolio-Wide");
    propertiesList.forEach((p) => {
      if (p.id !== "empty-prop" && p.address) {
        props.add(p.address);
      }
    });
    insights.forEach((i) => {
      if (i.property && i.property !== "-") {
        props.add(i.property);
      }
    });
    return Array.from(props);
  }, [propertiesList, insights]);

  const filteredInsights = useMemo(() => {
    return insights.filter((item) => {
      if (priorityFilter !== "All" && item.priority !== priorityFilter)
        return false;
      if (propertyFilter !== "All" && item.property !== propertyFilter)
        return false;
      if (yearFilter !== "All" && String(item.fy) !== String(yearFilter))
        return false;
      return true;
    });
  }, [insights, priorityFilter, propertyFilter, yearFilter]);

  const priorityCounts = useMemo(() => {
    const baseList = insights.filter((item) => {
      if (propertyFilter !== "All" && item.property !== propertyFilter)
        return false;
      if (yearFilter !== "All" && String(item.fy) !== String(yearFilter))
        return false;
      return true;
    });
    return {
      all: baseList.length,
      high: baseList.filter((i) => i.priority === "High").length,
      medium: baseList.filter((i) => i.priority === "Medium").length,
      low: baseList.filter((i) => i.priority === "Low").length,
    };
  }, [insights, propertyFilter, yearFilter]);

  const activeInsightList = filteredInsights;

  // Open modal in creation mode with context-based defaults
  const openAddInsightModal = (
    explicitProp?: string,
    explicitMet?: string,
    explicitFy?: string
  ) => {
    if (!canEdit) return;
    const { defaultProp, defaultMet } = getContextualDefaults();
    const prop =
      explicitProp ||
      (propertyFilter !== "All" ? propertyFilter : defaultProp);
    const met = explicitMet || defaultMet;
    const fy =
      explicitFy ||
      (yearFilter !== "All" ? yearFilter : String(reviewYear || 2026));

    setEditingInsightId(null);
    setCurrentInsightIndex(filteredInsights.length);
    setNewInsightFy(fy);
    setNewInsightProperty(prop);
    setNewInsightMetric(met);
    setNewInsightHeading("");
    setNewInsightObservation("");
    setNewInsightRecommendation("");
    setNewInsightPriority(
      priorityFilter !== "All" ? priorityFilter : "High"
    );
    setNewInsightOwner("Adviser");
    setNewInsightAction("");
    setNewInsightNotes("");
    setInsightSaveMsg("");
    setIsAddInsightOpen(true);
  };

  const loadInsightFromItem = (item: ReviewInsightItem, idx: number) => {
    setCurrentInsightIndex(idx);
    setEditingInsightId(item.id);
    setNewInsightFy(item.fy || String(reviewYear || 2026));
    setNewInsightProperty(item.property || "Portfolio-Wide");
    setNewInsightMetric(item.metric || "Rental Income");
    setNewInsightHeading(item.heading || "");
    setNewInsightObservation(item.insight === "-" ? "" : item.insight);
    setNewInsightRecommendation(
      item.recommendation === "-" ? "" : item.recommendation
    );
    setNewInsightPriority(item.priority || "High");
    setNewInsightOwner(item.owner || "Adviser");
    setNewInsightAction(item.action === "Review" ? "" : (item.action || ""));
    setNewInsightNotes(item.notes === "-" ? "" : (item.notes || ""));
    setInsightSaveMsg("");
  };

  // Populate form with an existing insight when scrolling/navigating
  const loadInsightAtIndex = (
    idx: number,
    list: ReviewInsightItem[] = activeInsightList
  ) => {
    if (idx < 0 || idx >= list.length) return;
    loadInsightFromItem(list[idx], idx);
  };

  const handleSelectRow = (item: ReviewInsightItem) => {
    const idx = filteredInsights.findIndex((i) => i.id === item.id);
    loadInsightFromItem(item, idx !== -1 ? idx : 0);
    setIsAddInsightOpen(true);
  };

  const isNewInsightMode = !editingInsightId;
  const hasPrevInsight =
    filteredInsights.length > 0 &&
    (isNewInsightMode || currentInsightIndex > 0);
  const hasNextInsight =
    filteredInsights.length > 0 &&
    Boolean(editingInsightId) &&
    currentInsightIndex < filteredInsights.length - 1;

  const handlePrevInsight = () => {
    if (isNewInsightMode) {
      if (filteredInsights.length > 0) {
        const lastIdx = filteredInsights.length - 1;
        loadInsightFromItem(filteredInsights[lastIdx], lastIdx);
      }
      return;
    }
    if (currentInsightIndex > 0 && filteredInsights.length > 0) {
      const prevIdx = currentInsightIndex - 1;
      loadInsightFromItem(filteredInsights[prevIdx], prevIdx);
    }
  };

  const handleNextInsight = () => {
    if (filteredInsights.length === 0) return;
    if (currentInsightIndex < filteredInsights.length - 1) {
      const nextIdx = currentInsightIndex + 1;
      loadInsightFromItem(filteredInsights[nextIdx], nextIdx);
    } else if (currentInsightIndex === filteredInsights.length - 1) {
      openAddInsightModal();
    }
  };

  useEffect(() => {
    if (!isAddInsightOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement as HTMLElement)?.tagName?.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea" || activeTag === "select") {
        return;
      }
      if (e.key === "ArrowLeft" && hasPrevInsight) {
        handlePrevInsight();
      } else if (e.key === "ArrowRight") {
        handleNextInsight();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAddInsightOpen, hasPrevInsight, hasNextInsight, currentInsightIndex, filteredInsights]);

  const handleDeleteCurrentInsight = async () => {
    if (!canEdit) return;
    if (!editingInsightId) return;
    if (!window.confirm("Are you sure you want to delete this insight?")) return;
    try {
      const existingItem = insights.find((i) => i.id === editingInsightId);
      const targetReviewId = existingItem?.reviewId || effectiveReviewId;
      await deleteInsightApi(targetReviewId, editingInsightId);
      const remaining = insights.filter((i) => i.id !== editingInsightId);
      setInsights(remaining);
      await onDataChanged?.();

      const nextFiltered = remaining.filter((item) => {
        if (priorityFilter !== "All" && item.priority !== priorityFilter)
          return false;
        if (propertyFilter !== "All" && item.property !== propertyFilter)
          return false;
        if (yearFilter !== "All" && String(item.fy) !== String(yearFilter))
          return false;
        return true;
      });

      if (nextFiltered.length > 0) {
        const nextIdx = Math.min(currentInsightIndex, nextFiltered.length - 1);
        loadInsightFromItem(nextFiltered[nextIdx], nextIdx);
      } else {
        openAddInsightModal();
      }
    } catch (err) {
      console.error("Failed to delete insight:", err);
    }
  };

  const handleAddInsightSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    if (!newInsightHeading.trim()) {
      setInsightSaveMsg("Please enter a heading for the insight.");
      return;
    }
    setIsSubmittingInsight(true);
    setInsightSaveMsg("");

    const screenName =
      activeTab === "property-analysis"
        ? propertySubView === "cash-management"
          ? "Cash Management"
          : propertySubView === "capital-management"
          ? "Capital Management"
          : "Property Analysis"
        : activeTab === "portfolio-overview"
        ? portfolioSubTab === "Summary"
          ? "Portfolio Overview"
          : `Portfolio Overview - ${portfolioSubTab}`
        : activeTab === "future-outlook"
        ? "Future Outlook"
        : activeTab === "insights"
        ? "Portfolio Management Insights"
        : "Executive Summary";

    try {
      if (editingInsightId) {
        const existingItem = insights.find((i) => i.id === editingInsightId);
        const matchedExistingReview = dbHousehold?.reviews?.find(
          (r: any) => r.id === existingItem?.reviewId
        );
        const matchedReviewByFy = dbHousehold?.reviews?.find(
          (r: any) => String(r.financialYear) === String(newInsightFy)
        );
        const targetReview = matchedExistingReview || matchedReviewByFy || activeReview;
        const targetReviewId = targetReview?.id || existingItem?.reviewId || effectiveReviewId;

        const res = await updateInsightApi(targetReviewId, editingInsightId, {
          criterionTitle: newInsightHeading.trim(),
          screen: existingItem?.screen || screenName,
          propertyName:
            newInsightProperty || currentProperty?.address || "Portfolio-Wide",
          maintenanceInsight:
            newInsightObservation.slice(0, 36) || "Adviser review",
          metric: newInsightMetric,
          owner: newInsightOwner,
          action: newInsightAction.trim() || "Review",
          insight:
            newInsightObservation.trim() ||
            "Adviser observation recorded during annual review.",
          recommendation:
            newInsightRecommendation.trim() ||
            "Review and action during current financial year.",
          priority: newInsightPriority.toUpperCase(),
          adviserNotes:
            newInsightNotes.trim() ||
            `Updated in FY${newInsightFy || reviewYear} review`,
        });

        const finalId = res?.id || editingInsightId;
        const updatedItem: ReviewInsightItem = {
          id: finalId,
          fy: newInsightFy,
          reviewId: targetReviewId,
          screen: existingItem?.screen || screenName,
          property: newInsightProperty,
          maintenanceInsight:
            newInsightObservation.slice(0, 36) || "Adviser review",
          metric: newInsightMetric,
          heading: newInsightHeading.trim(),
          insight: newInsightObservation.trim() || "-",
          recommendation: newInsightRecommendation.trim() || "-",
          priority: newInsightPriority,
          owner: newInsightOwner,
          action: newInsightAction.trim() || "Review",
          notes: newInsightNotes.trim() || "-",
        };

        setInsights((prev) =>
          prev.map((i) => (i.id === editingInsightId ? updatedItem : i))
        );
        setEditingInsightId(finalId);

        await onDataChanged?.();
        setInsightSaveMsg("Insight updated successfully!");
        setTimeout(() => setInsightSaveMsg(""), 3000);
      } else {
        const targetReview =
          dbHousehold?.reviews?.find(
            (r: any) => String(r.financialYear) === String(newInsightFy)
          ) || activeReview;
        const targetReviewId = targetReview?.id || effectiveReviewId;

        // Ensure review is in IN_PROGRESS if needed
        if (targetReview?.tchReviewStatus && targetReview.tchReviewStatus === "COMPLETED") {
          try {
            await updateReviewApi(targetReviewId, { tchReviewStatus: "IN_PROGRESS" });
          } catch (statusErr) {
            console.warn("Could not set review status to IN_PROGRESS:", statusErr);
          }
        }

        const res = await createInsightApi(targetReviewId, {
          criterionTitle: newInsightHeading.trim(),
          screen: screenName,
          propertyName:
            newInsightProperty || currentProperty?.address || "Portfolio-Wide",
          maintenanceInsight:
            newInsightObservation.slice(0, 36) || "Adviser review",
          metric: newInsightMetric,
          owner: newInsightOwner,
          action: newInsightAction.trim() || "Review",
          insight:
            newInsightObservation.trim() ||
            "Adviser observation recorded during annual review.",
          recommendation:
            newInsightRecommendation.trim() ||
            "Review and action during current financial year.",
          priority: newInsightPriority.toUpperCase(),
          adviserNotes:
            newInsightNotes.trim() ||
            `Added in FY${newInsightFy || reviewYear} review`,
        });

        if (res && res.id) {
          const newItem: ReviewInsightItem = {
            id: res.id,
            reviewId: targetReviewId,
            fy: String(targetReview?.financialYear || newInsightFy || reviewYear),
            screen: screenName,
            property: newInsightProperty || "Portfolio-Wide",
            maintenanceInsight:
              newInsightObservation.slice(0, 36) || "Adviser review",
            metric: newInsightMetric,
            heading: newInsightHeading.trim(),
            insight: newInsightObservation.trim() || "-",
            recommendation: newInsightRecommendation.trim() || "-",
            priority: newInsightPriority,
            owner: newInsightOwner,
            action: newInsightAction.trim() || "Review",
            notes: newInsightNotes.trim() || "-",
          };
          setInsights((prev) => [newItem, ...prev]);
        }

        await onDataChanged?.();
        setIsAddInsightOpen(false);
      }
    } catch (err: any) {
      console.error("Failed to save insight:", err);
      setInsightSaveMsg(err?.message || "Failed to save insight. Please try again.");
      setTimeout(() => setInsightSaveMsg(""), 3500);
    } finally {
      setIsSubmittingInsight(false);
    }
  };

  const targetYear = 2026 + activeLevers.forecastHorizon;

  // Portfolio Overview & Future Outlook aggregations from DB properties & entities
  const portfolioStats = useMemo(() => {
    const validProps = propertiesList.filter((p) => p.id !== "empty-prop");
    const invProps = validProps.filter((p) => !p.isOwnerOccupied);
    const ooProps = validProps.filter((p) => p.isOwnerOccupied);

    const invVal = invProps.reduce((s, p) => s + (p.rawValue || 0), 0);
    const invLoans = invProps.reduce((s, p) => s + (p.rawLoans || 0), 0);
    const invEquity = Math.max(0, invVal - invLoans);
    const invLvr = invVal > 0 ? (invLoans / invVal) * 100 : 0;

    const ooVal = ooProps.reduce((s, p) => s + (p.rawValue || 0), 0);
    const ooLoans = ooProps.reduce((s, p) => s + (p.rawLoans || 0), 0);
    const ooEquity = Math.max(0, ooVal - ooLoans);

    const totalVal = invVal + ooVal;
    const totalLoans = invLoans + ooLoans;
    const totalEquity = Math.max(0, totalVal - totalLoans);
    const totalLvr = totalVal > 0 ? (totalLoans / totalVal) * 100 : 0;

    const usableEquity80 = Math.max(0, invVal * 0.8 - invLoans);

    const totalWeeklyRent = invProps.reduce(
      (s, p) => s + (p.rawWkRent || 0),
      0
    );
    const totalAnnualRent = invProps.reduce(
      (s, p) => s + (p.rawGrossRent || 0),
      0
    );
    const totalAnnualExpenses = invProps.reduce(
      (s, p) => s + (p.rawExpenses || 0),
      0
    );
    const totalDebtService = invProps.reduce(
      (s, p) => s + (p.rawDebtService || 0),
      0
    );
    const preTaxCashFlow =
      totalAnnualRent - totalAnnualExpenses - totalDebtService;
    const portfolioGrossYield =
      invVal > 0 ? (totalAnnualRent / invVal) * 100 : 4.61;
    const portfolioNetYield =
      invVal > 0
        ? (Math.max(0, totalAnnualRent - totalAnnualExpenses) / invVal) * 100
        : 3.1;
    const avgValuation =
      validProps.length > 0 ? Math.round(totalVal / validProps.length) : 0;
    const totalPurchasePrice = validProps.reduce(
      (s, p) => s + (Number(String(p.purchasePrice || "0").replace(/[^0-9]/g, "")) || 0),
      0
    );
    const totalLoansCount =
      validProps.reduce(
        (s, p) => s + ((p.loans && p.loans.length) || 0),
        0
      ) || (invLoans > 0 ? 1 : 0);

    const superBal = Array.isArray(dbHousehold?.entities)
      ? dbHousehold.entities.reduce(
          (s: number, e: any) => s + Number(e.superBalance || 0),
          0
        )
      : 0;

    const homeGrowthDec = (homeGrowthRate || 3.0) / 100;
    const invGrowthDec = (invGrowthRate || 5.0) / 100;

    const projectedHomeVal =
      ooVal > 0
        ? Math.round(ooVal * Math.pow(1 + homeGrowthDec, forecastHorizon))
        : 4629309;
    const projectedInvVal =
      invVal > 0
        ? Math.round(invVal * Math.pow(1 + invGrowthDec, forecastHorizon))
        : 6000000;
    const projectedInvEquity =
      invVal > 0 ? Math.max(0, projectedInvVal - invLoans) : 4766915;
    const projectedAfterTaxIncome =
      invVal > 0 ? Math.round(projectedInvEquity * 0.02488) : 118632;

    return {
      validProps,
      invProps,
      ooProps,
      invVal,
      invLoans,
      invEquity,
      invLvr,
      ooVal,
      ooLoans,
      ooEquity,
      totalVal,
      totalLoans,
      totalEquity,
      totalLvr,
      usableEquity80,
      totalWeeklyRent,
      totalAnnualRent,
      totalAnnualExpenses,
      totalDebtService,
      preTaxCashFlow,
      portfolioGrossYield,
      portfolioNetYield,
      avgValuation,
      totalPurchasePrice,
      totalLoansCount,
      superBal,
      projectedHomeVal,
      projectedInvEquity,
      projectedAfterTaxIncome,
    };
  }, [propertiesList, dbHousehold, homeGrowthRate, invGrowthRate, forecastHorizon]);

  // Dynamic calculations for Future Outlook interactive graph and sliders
  const computeOutlook = useCallback(
    (levers: typeof activeLevers, isA: boolean) => {
      const validProps = propertiesList.filter((p) => p.id !== "empty-prop");
      const invProps = validProps.filter((p) => !p.isOwnerOccupied);
      const ooProps = validProps.filter((p) => p.isOwnerOccupied);

      const dbInvVal = invProps.reduce((s, p) => s + (p.rawValue || 0), 0);
      const dbInvLoans = invProps.reduce((s, p) => s + (p.rawLoans || 0), 0);
      const dbOoVal = ooProps.reduce((s, p) => s + (p.rawValue || 0), 0);
      const dbOoLoans = ooProps.reduce((s, p) => s + (p.rawLoans || 0), 0);
      const dbSuper = Array.isArray(dbHousehold?.entities)
        ? dbHousehold.entities.reduce(
            (s: number, e: any) => s + Number(e.superBalance || 0),
            0
          )
        : Array.isArray(dbHousehold?.members)
        ? dbHousehold.members.reduce(
            (s: number, m: any) => s + Number(m.currentSuperBalance || 0),
            0
          )
        : 0;

      // Anchored baselines for Harrison Family 2026
      const baseHomeVal = dbOoVal > 0 ? dbOoVal : 790000;
      const baseHomeLoans = dbOoLoans > 0 ? dbOoLoans : 310000;
      const baseHomeEquity = Math.max(0, baseHomeVal - baseHomeLoans);

      const baseInvVal = dbInvVal > 0 ? dbInvVal : 5100000;
      const baseInvLoans = dbInvLoans > 0 ? dbInvLoans : 3470000;
      const baseInvEquity = Math.max(0, baseInvVal - baseInvLoans);

      const baseSuper = dbSuper > 0 ? dbSuper : 650000;

      // Client portfolio actual metrics for comparison
      const clientPortfolioCagr =
        portfolioStats.invVal > 0 && invProps.length > 0
          ? invProps.reduce(
              (s, p) => s + (p.rawGrowthPct || 3.8) * (p.rawValue || 0),
              0
            ) / portfolioStats.invVal
          : 3.8;
      const clientPortfolioNetYield =
        portfolioStats.portfolioNetYield > 0
          ? portfolioStats.portfolioNetYield
          : 3.1;
      const clientHomeGrowth = ooProps[0]?.rawGrowthPct || 3.0;

      const adultCount = Math.max(
        1,
        Array.isArray(dbHousehold?.members) && dbHousehold.members.length > 0
          ? dbHousehold.members.length
          : Array.isArray(dbHousehold?.entities) && dbHousehold.entities.length > 0
          ? dbHousehold.entities.length
          : 2
      );

      const cpiRate = (globalAssumptions.forecastCpi ?? 3.0) / 100;
      const cgtRate = (globalAssumptions.cgtTaxRate ?? 30.0) / 100;
      const invReturnRate = (globalAssumptions.investmentReturn ?? 5.0) / 100;
      const incomeTaxRate = (globalAssumptions.incomeTaxRate ?? 30.0) / 100;
      const netReturnRate = invReturnRate * (1 - incomeTaxRate);

      const yieldDiff = Math.max(0, (levers.invNetYield - clientPortfolioNetYield) / 100);
      const extraAnnualCashFromYield = Math.round(baseInvVal * yieldDiff);

      const T = levers.forecastHorizon;

      const gH = levers.homeGrowthRate / 100;
      const eH = levers.homeExtraRepayment;
      const dP =
        levers.homeDownsizerPrice <= 1000
          ? levers.homeDownsizerPrice * 1000
          : levers.homeDownsizerPrice;

      const gI = levers.invGrowthRate / 100;
      const eI = levers.invExtraRepayment;
      const aI = levers.invAddlInvestment;

      const rS = levers.superReturnRate / 100;
      const cS = levers.superExtraContrib;

      const hValCompound = baseHomeVal * Math.pow(1 + gH, T);
      const hDebtCompound = Math.max(0, baseHomeLoans - eH * 12 * T);
      const replCost = dP > 0 ? dP * Math.pow(1 + gH, T) : 0;
      const hEquityCompound = Math.max(0, hValCompound - hDebtCompound);

      const projectedHomeVal =
        dP > 0
          ? Math.round(1240000 * Math.pow(1 + (gH - 0.03), T) * (dP / 250000) * (T / 20))
          : Math.round(hEquityCompound);

      const releasedCapital = Math.max(0, hValCompound - hDebtCompound - replCost);
      const maxSuperDownsize = 300000 * adultCount;
      const downsizeToSuper = dP > 0 ? Math.min(releasedCapital, maxSuperDownsize) : 0;
      const downsizeToInvestedCapital = Math.max(0, releasedCapital - downsizeToSuper);

      const invGrowthFactor = Math.pow(1 + gI, T) / Math.pow(1.06, 20);
      const extraInvDebtReduction = (eI - 1250) * 12 * T + extraAnnualCashFromYield * T;
      const projectedInvEquity = Math.round(
        (7330000 * invGrowthFactor + extraInvDebtReduction + aI) * (isA ? 1 : 1.05)
      );

      const superGrowthFactor = Math.pow(1 + rS, T) / Math.pow(1.06, 20);
      const extraSuperContrib = (cS - 1250) * 12 * T * 1.5;
      const projectedSuperBal = Math.round(
        (4220000 * superGrowthFactor + extraSuperContrib) * (isA ? 1 : 1.04)
      );

      // CGT
      const vReform = baseInvVal * Math.pow(1 + gI, 1);
      const preReformGain = Math.max(0, vReform - baseInvVal);
      const cgtPre = Math.round(preReformGain * 0.5 * cgtRate);
      const indexedCostPost = vReform * Math.pow(1 + cpiRate, Math.max(0, T - 1));
      const postReformGain = Math.max(0, (baseInvVal + aI) * Math.pow(1 + gI, T) - indexedCostPost);
      const cgtPost = Math.round(postReformGain * cgtRate);
      const totalCgt = cgtPre + cgtPost;

      const projectedInvestedCapital = Math.max(0, projectedInvEquity + downsizeToInvestedCapital - totalCgt);
      const projectedAfterTaxIncome = Math.round(projectedInvestedCapital * netReturnRate);
      const projectedSuperPensionIncome = Math.round(projectedSuperBal * 0.05);

      const baseIncome = isA ? 209912 : 230482;
      const incomeDelta = Math.round(
        (projectedInvEquity - 7330000) * 0.015 +
        (projectedSuperBal - 4220000) * 0.025 +
        (levers.incomeGoal - 60000) * 0.2
      );
      const projectIncomeTotal = Math.max(10000, baseIncome + incomeDelta);

      // SVG Chart geometry across 0, 5, 10, 15, 20 years
      const years = [0, 5, 10, 15, 20];
      const series = years.map((yr) => {
        const f = yr / 20;
        const h = baseHomeEquity * Math.pow(Math.max(1, projectedHomeVal) / Math.max(1, baseHomeEquity), f);
        const s = baseSuper * Math.pow(Math.max(1, projectedSuperBal) / Math.max(1, baseSuper), f);
        const i = baseInvEquity * Math.pow(Math.max(1, projectedInvEquity) / Math.max(1, baseInvEquity), f);
        return { t: yr, h: Math.round(h), s: Math.round(s), i: Math.round(i) };
      });

      const xForT = (t: number) => 45 + (Math.min(25, Math.max(0, t)) / 20) * 280;
      const yForVal = (val: number) => 138 - (Math.min(10000000, Math.max(0, val)) / 10000000) * 120;

      const ptsHome = series.map((d) => ({ x: xForT(d.t), y: yForVal(d.h) }));
      const ptsInv = series.map((d) => ({ x: xForT(d.t), y: yForVal(d.i) }));
      const ptsSuper = series.map((d) => ({ x: xForT(d.t), y: yForVal(d.s) }));

      const spline = (pts: { x: number; y: number }[]) => {
        if (pts.length === 0) return "";
        let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
        for (let idx = 0; idx < pts.length - 1; idx++) {
          const p0 = pts[idx === 0 ? 0 : idx - 1];
          const p1 = pts[idx];
          const p2 = pts[idx + 1];
          const p3 = pts[idx + 2 < pts.length ? idx + 2 : idx + 1];
          const cp1x = p1.x + (p2.x - p0.x) / 6;
          const cp1y = p1.y + (p2.y - p0.y) / 6;
          const cp2x = p2.x - (p3.x - p1.x) / 6;
          const cp2y = p2.y - (p3.y - p1.y) / 6;
          d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(
            1
          )} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
        }
        return d;
      };

      const pathHome = spline(ptsHome);
      const pathInv = spline(ptsInv);
      const pathSuper = spline(ptsSuper);

      const markerX = xForT(T);
      const markerYHome = yForVal(projectedHomeVal);
      const markerYInv = yForVal(projectedInvEquity);
      const markerYSuper = yForVal(projectedSuperBal);

      const computeAtYear = (t: number) => {
        const f = Math.min(1, Math.max(0, t / 20));
        return {
          t,
          hEquity: Math.round(baseHomeEquity * Math.pow(Math.max(1, projectedHomeVal) / Math.max(1, baseHomeEquity), f)),
          iEquity: Math.round(baseInvEquity * Math.pow(Math.max(1, projectedInvEquity) / Math.max(1, baseInvEquity), f)),
          sBal: Math.round(baseSuper * Math.pow(Math.max(1, projectedSuperBal) / Math.max(1, baseSuper), f)),
        };
      };

      return {
        baseHomeVal,
        baseHomeLoans,
        baseHomeEquity,
        baseInvVal,
        baseInvLoans,
        baseInvEquity,
        baseSuper,
        projectedHomeVal,
        finalProjectedHomeVal: projectedHomeVal,
        originalHomeVal: Math.round(hValCompound),
        downsizerCostToday: dP,
        projectedInvEquity,
        projectedInvestedCapital,
        projectedAfterTaxIncome,
        projectedSuperBal,
        projectedSuperPensionIncome,
        projectIncomeTotal,
        releasedCapital,
        downsizeToSuper,
        downsizeToInvestedCapital,
        cgtPre,
        cgtPost,
        totalCgt,
        clientPortfolioCagr,
        clientPortfolioNetYield,
        clientHomeGrowth,
        adultCount,
        extraAnnualCashFromYield,
        pathHome,
        pathInv,
        pathSuper,
        markerX,
        markerYHome,
        markerYInv,
        markerYSuper,
        computeAtYear,
        xForT,
        yForVal,
        series,
      };
    },
    [propertiesList, dbHousehold, globalAssumptions, portfolioStats]
  );

  const dataA = useMemo(
    () =>
      computeOutlook(
        {
          forecastHorizon,
          homeGrowthRate,
          homeExtraRepayment,
          homeDownsizerPrice,
          invGrowthRate,
          invNetYield,
          invExtraRepayment,
          invAddlInvestment,
          superReturnRate,
          superExtraContrib,
          incomeGoal,
        },
        true
      ),
    [
      computeOutlook,
      forecastHorizon,
      homeGrowthRate,
      homeExtraRepayment,
      homeDownsizerPrice,
      invGrowthRate,
      invNetYield,
      invExtraRepayment,
      invAddlInvestment,
      superReturnRate,
      superExtraContrib,
      incomeGoal,
    ]
  );

  const dataB = useMemo(
    () => computeOutlook(scenarioBLevers, false),
    [computeOutlook, scenarioBLevers]
  );

  const futureOutlookData = activeScenario === "a" ? dataA : dataB;
  const surplus = dataB.projectIncomeTotal - dataA.projectIncomeTotal;

  // Reusable Metric Card matching Figma (compact non-scrolling layout)
  const renderMetricCard = (
    label: string,
    value: string,
    sub: string,
    iconSrc: string,
    onClick?: () => void,
    isSelected?: boolean
  ) => (
    <div
      key={label}
      onClick={onClick}
      className={`flex flex-col gap-[3px] items-start px-[11px] py-[7px] rounded-[9px] w-full transition-all duration-150 ${
        onClick ? "cursor-pointer hover:border-[#0e2841]/50" : ""
      } ${
        isSelected
          ? "bg-[#EEF4F9] border-2 border-[#0e2841] shadow-xs"
          : "bg-[#f6f9fb] border border-transparent"
      }`}
    >
      <div className="flex gap-[8px] items-center w-full">
        <div className="bg-white border-[#dce4e8] border-[0.27px] border-solid drop-shadow-[0px_2px_1px_rgba(0,0,0,0.04)] flex items-center justify-center p-[3px] rounded-full shrink-0 size-[32px]">
          <img src={iconSrc} alt="" className="size-[16px] object-contain" />
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <p className="font-['Poppins',sans-serif] font-medium text-[#1a1c1e] text-[11px] leading-tight truncate">
            {label}
          </p>
          <p className="font-['Poppins',sans-serif] font-extrabold text-[#0e2841] text-[13.5px] leading-snug mt-[1px]">
            {value}
          </p>
          <div className="w-full max-w-[120px] h-[1px] bg-[#dce4e8] my-[2px]" />
          <p className="font-['Poppins',sans-serif] font-normal text-[#64748B] text-[10px] leading-tight truncate">
            {sub}
          </p>
        </div>
      </div>
    </div>
  );

  // Exact Figma Wave Chart (from 1044:9552 using downloaded Figma SVGs) — Interactive on Hover & Metric reactive
  const renderNetYieldChart = (overrideTitle?: string) => {
    const config = METRIC_CHART_CONFIGS[selectedMetric];
    const title = overrideTitle || config?.waveTitle || "Net Yield History & Trend";
    const sub = config?.waveSubtitle || "Annual net operating yield after all property outgoings across financial years";
    const points = config?.points || NET_YIELD_POINTS;

    const activeIdx =
      hoveredYieldPointIndex !== null ? hoveredYieldPointIndex : 4;
    const activePoint = points[activeIdx] || points[4] || points[0];

    const dotContainerX = 21.82 + activePoint.cx;
    const dotContainerY = 6.47 + activePoint.cy;
    const isTooltipFlippedBelow = dotContainerY < 45;

    const rawTooltipLeft = dotContainerX - 41.657;
    const tooltipLeft = Math.max(0, Math.min(426, rawTooltipLeft));
    const tooltipTop = isTooltipFlippedBelow
      ? dotContainerY + 9
      : dotContainerY - 48.293;

    const handleWaveMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      let closestIdx = 0;
      let minDist = Infinity;
      points.forEach((pt, idx) => {
        const ptX = 21.82 + pt.cx;
        const dist = Math.abs(relX - ptX);
        if (dist < minDist) {
          minDist = dist;
          closestIdx = idx;
        }
      });
      setHoveredYieldPointIndex(closestIdx);
    };

    return (
      <div className="bg-white flex flex-col gap-[4px] h-[155px] items-start overflow-hidden px-[16px] py-[8px] rounded-[10px] shadow-[0px_4px_12px_rgba(0,0,0,0.03)] w-full">
        <div className="flex items-center justify-between w-full">
          <div className="flex flex-col gap-[2px] items-start">
            <p className="font-['Poppins',sans-serif] font-semibold leading-[1.3] text-[#0e2841] text-[11px] tracking-[-0.19px]">
              {title}
            </p>
            <p className="font-['Poppins',sans-serif] font-medium leading-[1.3] text-[#8C9BA8] text-[9.5px] tracking-[-0.19px]">
              {sub}
            </p>
          </div>
          <div className="bg-white border-[#07315b] border-[0.821px] border-solid flex gap-[3px] items-center pl-[8px] pr-[5px] py-[4px] rounded-[6px] shadow-2xs shrink-0 cursor-pointer">
            <span className="font-['Poppins',sans-serif] font-medium text-[#0e2841] text-[10.5px]">
              5 Years
            </span>
            <img
              src="/images/review/282b5.svg"
              alt=""
              className="size-[14px]"
            />
          </div>
        </div>

        {/* Wave + Grid Area using exact coordinates */}
        <div className="w-full overflow-x-auto">
          <div
            onMouseMove={handleWaveMouseMove}
            onMouseLeave={() => setHoveredYieldPointIndex(null)}
            className="relative flex flex-col gap-[6px] items-start w-[514px] h-[135px] cursor-crosshair"
          >
            <div className="flex gap-[9.7px] items-start">
              <div className="flex flex-col font-semibold gap-[10px] items-start leading-normal text-[#6b6b6b] text-[9px] tracking-[-0.194px] whitespace-nowrap select-none">
                <span>10%</span>
                <span>8%</span>
                <span>6%</span>
                <span>4%</span>
                <span>2%</span>
                <span>0%</span>
              </div>
              <div className="h-[110px] relative shrink-0 w-[462.795px]">
                <img
                  src="/images/review/80cb1.svg"
                  alt=""
                  className="absolute block inset-0 max-w-none size-full opacity-80"
                />
              </div>
            </div>

            <div className="absolute h-[105px] left-[25.86px] top-[2px] w-[482.474px] pointer-events-none">
              <img
                src="/images/review/9416d.svg"
                alt=""
                className="block max-w-none size-full"
              />
            </div>

            {/* Vertical hover indicator line */}
            {hoveredYieldPointIndex !== null && (
              <div
                style={{ left: `${dotContainerX}px` }}
                className="absolute top-[4px] h-[110px] w-[1px] border-l border-dashed border-[#07315B]/40 pointer-events-none transition-all duration-150"
              />
            )}

            {/* Interactive SVG Dots along the wave */}
            <div className="absolute h-[90px] left-[21.82px] top-[4px] w-[492.172px]">
              <svg
                width="492.172"
                height="90"
                viewBox="0 0 492.172 108.39"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="overflow-visible block size-full"
              >
                {points.map((pt, idx) => {
                  const isActive = idx === activeIdx;
                  const isHovered = idx === hoveredYieldPointIndex;
                  return (
                    <g
                      key={pt.id}
                      onMouseEnter={() => setHoveredYieldPointIndex(idx)}
                      className="cursor-pointer"
                    >
                      <circle
                        cx={pt.cx}
                        cy={pt.cy}
                        r={16}
                        fill="transparent"
                      />
                      {isHovered && (
                        <circle
                          cx={pt.cx}
                          cy={pt.cy}
                          r={9.5}
                          fill="#07315B"
                          fillOpacity={0.16}
                        />
                      )}
                      <ellipse
                        cx={pt.cx}
                        cy={pt.cy}
                        rx={isHovered ? 6.4 : 5.65715}
                        ry={isHovered ? 6.4 : 5.66219}
                        fill={isActive ? "#07315B" : "white"}
                        stroke="#07315B"
                        strokeWidth={2.42557}
                        className="transition-all duration-150"
                      />
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* X-Axis Labels + Active Underline */}
            <div className="absolute bottom-[2px] flex gap-[37.97px] items-start left-[19.4px] text-[#6b6b6b] text-[9px] font-semibold tracking-[-0.194px] whitespace-nowrap">
              {[
                "FY 2021",
                "FY 2022",
                "FY 2023",
                "FY 2024",
                "FY 2025",
                "FY 2026",
                "FY 2022",
              ].map((lbl, lblIdx) => {
                const isLblActive =
                  hoveredYieldPointIndex !== null &&
                  activePoint.labelIndex === lblIdx;
                return (
                  <span
                    key={`${lbl}-${lblIdx}`}
                    className={`transition-colors duration-150 ${
                      isLblActive ? "text-[#0e2841] font-bold" : ""
                    }`}
                  >
                    {lbl}
                  </span>
                );
              })}
              <div
                style={{ left: `${activePoint.underlineLeft}px` }}
                className="absolute h-0 top-[14px] w-[13.74px] transition-all duration-150"
              >
                <img
                  src="/images/review/ceac1.svg"
                  alt=""
                  className="block max-w-none w-[14px] h-[2px]"
                />
              </div>
            </div>

            {/* Interactive Floating Tooltip Union */}
            <div
              style={{
                left: `${tooltipLeft}px`,
                top: `${tooltipTop}px`,
              }}
              className="absolute h-[34px] w-[84px] pointer-events-none transition-all duration-150 z-10"
            >
              <img
                src="/images/review/85fe1.svg"
                alt=""
                className={`absolute block inset-0 max-w-none size-full ${
                  isTooltipFlippedBelow ? "scale-y-[-1]" : ""
                }`}
              />
              <div
                style={{
                  top: isTooltipFlippedBelow ? "13px" : "7px",
                }}
                className="absolute bg-white flex h-[13px] items-center justify-center left-[11px] rounded-full w-[13px]"
              >
                <img
                  src="/images/review/0d7f6.svg"
                  alt=""
                  className={`size-[7px] transition-transform duration-150 ${
                    activePoint.trend === "down" ? "rotate-40" : "-rotate-40"
                  }`}
                />
              </div>
              <p
                style={{
                  top: isTooltipFlippedBelow ? "11px" : "5px",
                }}
                className="absolute font-semibold leading-[1.4] left-[28px] text-[10.5px] text-white tracking-[-0.2px] whitespace-nowrap"
              >
                P: {activePoint.value}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Exact Figma 4-Bar Chart — Interactive on Hover & Metric reactive with System Settings Benchmarks
  const renderBenchmarkBarChart = (overrideTitle?: string) => {
    const config = METRIC_CHART_CONFIGS[selectedMetric];
    const title = overrideTitle || config?.benchmarkTitle || "Benchmark comparison";

    // Dynamic resolution from System Settings mapped benchmarks
    const mappedBenchmarks = systemBenchmarks.filter(
      (b: any) =>
        Array.isArray(b.picfoMetrics) &&
        b.picfoMetrics.some(
          (m: string) =>
            m.toLowerCase() === selectedMetric.toLowerCase() ||
            (selectedMetric.includes("Return") && m.includes("Return")) ||
            (selectedMetric.includes("Yield") && m.includes("Yield")) ||
            (selectedMetric.includes("Value") && m.includes("Value"))
        )
    );

    let bars = config?.bars || BENCHMARK_BARS;
    if (mappedBenchmarks.length > 0) {
      const subjectBar = {
        id: "subject",
        value: selectedMetric.includes("Yield") ? "3.57%" : selectedMetric.includes("Return") ? "6.8%" : "8.5%",
        height: 120,
        line1: "subject",
        line2: "property",
        spacer: false,
        fadedValue: false,
        diff: "Subject Property",
      };
      const dynamicBars = mappedBenchmarks.slice(0, 3).map((bm: any, idx: number) => {
        const hv = bm.historicalValues || [];
        const latestHv = hv[hv.length - 1];
        const valStr = latestHv?.value || bm.latestFy || "5.0%";
        const num = parseFloat(String(valStr).replace(/[^0-9.]/g, "")) || (5.5 - idx * 0.8);
        const barHeight = Math.min(130, Math.max(28, Math.round(num * 14)));
        const diffNum = (num - 3.57).toFixed(1);
        const nameParts = String(bm.measure || "Benchmark").split(" ");
        const line1 = nameParts.slice(0, Math.ceil(nameParts.length / 2)).join(" ");
        const line2 = nameParts.slice(Math.ceil(nameParts.length / 2)).join(" ") || "";
        return {
          id: `bm-${bm.id || idx}`,
          value: String(valStr).includes("%") ? valStr : `${valStr}%`,
          height: barHeight,
          line1,
          line2: line2 || "-",
          spacer: !line2,
          fadedValue: idx > 1,
          diff: `${bm.measure} (${num >= 3.57 ? "+" : ""}${diffNum}% vs subj)`,
        };
      });
      bars = [subjectBar, ...dynamicBars];
    }

    return (
      <div className="bg-white flex flex-col gap-[4px] h-[155px] items-start justify-between px-[16px] py-[8px] rounded-[10px] shadow-[0px_4px_12px_rgba(0,0,0,0.03)] w-full">
        <div className="flex items-center justify-between w-full">
          <div className="flex gap-[8px] h-[20px] items-center">
            <div className="bg-white drop-shadow-[0px_2px_1px_rgba(0,0,0,0.04)] flex items-start p-[3px] rounded-full">
              <img
                src="/images/review/ce848.svg"
                alt=""
                className="w-[13px] h-[12.5px]"
              />
            </div>
            <p className="font-['Poppins',sans-serif] font-semibold leading-[1.3] text-[#0e2841] text-[12px] tracking-[-0.24px]">
              {title}
            </p>
          </div>
        </div>

        <div className="flex gap-[16px] h-[110px] items-center justify-between w-full">
          {/* Y-Axis */}
          <div className="flex flex-col font-semibold gap-[6px] h-[95px] items-start leading-normal text-[#1a1c1e] text-[9.5px] tracking-[-0.2px] whitespace-nowrap select-none">
            <span>10%</span>
            <span>8%</span>
            <span>6%</span>
            <span>4%</span>
            <span>2%</span>
            <span>0</span>
          </div>

          {/* 4 Dark Navy Bars — Interactive on Hover */}
          <div
            onMouseLeave={() => setHoveredBenchmarkBarId(null)}
            className="flex items-end justify-between flex-1 max-w-[467px] pr-2"
          >
            {bars.map((bar) => {
              const isHovered = hoveredBenchmarkBarId === bar.id;
              const isDimmed =
                hoveredBenchmarkBarId !== null &&
                hoveredBenchmarkBarId !== bar.id;
              const scaledHeight = Math.max(22, Math.round(bar.height * 0.58));
              return (
                <div
                  key={bar.id}
                  onMouseEnter={() => setHoveredBenchmarkBarId(bar.id)}
                  className="relative flex flex-col gap-[6px] items-center cursor-pointer group"
                >
                  {/* Floating Hover Tooltip */}
                  {isHovered && (
                    <div className="absolute -top-[30px] left-1/2 -translate-x-1/2 bg-[#0e2841] text-white text-[10px] font-semibold px-2 py-0.5 rounded-[5px] shadow-md whitespace-nowrap z-20 pointer-events-none animate-in fade-in duration-150">
                      <span>
                        {bar.value} · {bar.diff}
                      </span>
                      <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-[#0e2841]" />
                    </div>
                  )}

                  <div className="flex flex-col gap-[6px] items-center justify-center">
                    <span
                      className={`font-semibold text-[11px] tracking-[-0.2px] transition-colors duration-150 ${
                        isHovered
                          ? "text-[#0e2841] font-bold scale-105"
                          : bar.fadedValue
                          ? "text-[#6b6b6b] opacity-70"
                          : "text-[#6b6b6b]"
                      }`}
                    >
                      {bar.value}
                    </span>
                    <div
                      style={{ height: `${scaledHeight}px` }}
                      className={`w-[42px] transition-all duration-150 rounded-t-[2px] ${
                        isHovered
                          ? "bg-[#1255ad] shadow-[0px_4px_10px_rgba(18,85,173,0.3)] -translate-y-0.5"
                          : isDimmed
                          ? "bg-[#0e2841]/55"
                          : "bg-[#0e2841]"
                      }`}
                    />
                  </div>
                  <div
                    className={`font-semibold text-[10.5px] text-center tracking-[-0.2px] leading-tight transition-colors duration-150 ${
                      isHovered ? "text-[#0e2841]" : "text-[#a0a0a0]"
                    }`}
                  >
                    <p>{bar.line1}</p>
                    <p className={bar.spacer ? "invisible" : ""}>{bar.line2}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Helper to fetch insights matching the selected metric
  const getInsightsForMetric = (metricKey: string, propertyAddress?: string) => {
    const propToken = (propertyAddress || "").split(" ")[0].toLowerCase();
    const matching = insights.filter((item) => {
      const m = (item.metric || "").toLowerCase();
      const h = (item.heading || "").toLowerCase();
      const k = metricKey.toLowerCase();
      const itemProp = (item.property || "").toLowerCase();
      const propMatch =
        !propToken ||
        itemProp === "portfolio-wide" ||
        itemProp.includes(propToken);
      if (!propMatch) return false;

      if (k.includes("value") || k.includes("valuation") || k.includes("growth")) {
        return m.includes("valuation") || m.includes("value") || m.includes("growth") || h.includes("valuation");
      }
      if (k.includes("loan") || k.includes("debt")) {
        return m.includes("loan") || m.includes("debt") || m.includes("rate") || h.includes("loan") || h.includes("debt");
      }
      if (k.includes("equity")) {
        return m.includes("equity") || h.includes("equity");
      }
      if (k.includes("return") || k.includes("yield") || k.includes("rent")) {
        return m.includes("rent") || m.includes("yield") || m.includes("return") || h.includes("rent") || h.includes("yield");
      }
      if (k.includes("lvr")) {
        return m.includes("lvr") || m.includes("loan") || h.includes("lvr");
      }
      return m.includes(k) || h.includes(k);
    });

    if (matching.length > 0) return matching;

    const defaults =
      DEFAULT_METRIC_INSIGHTS[metricKey] ||
      DEFAULT_METRIC_INSIGHTS["Total Property Return"];
    if (propertyAddress) {
      return defaults.map((d) => ({ ...d, property: propertyAddress }));
    }
    return defaults;
  };

  // Dedicated scrollable Insights & Recommendations Carousel matching user annotation
  const renderInsightsCarousel = (
    metricKey: string,
    propertyName?: string
  ) => {
    const list = getInsightsForMetric(metricKey, propertyName);
    const totalCount = list.length;
    const card1 = list[carouselIndex] || list[0];
    const card2 = totalCount > 1 ? list[carouselIndex + 1] : null;

    return (
      <div className="bg-white rounded-[10px] p-2.5 sm:p-3 border border-[#E2E8F0] shadow-[0px_4px_12px_rgba(0,0,0,0.03)] mt-1.5">
        <div className="flex items-center justify-between mb-1.5 px-1">
          <div className="flex items-center gap-2">
            <span className="font-['Poppins',sans-serif] font-bold text-[#0e2841] text-[13px]">
              Insights &amp; Recommendations
            </span>
            <span className="text-[11px] font-medium bg-[#f0f4f8] text-[#0e2841] px-2.5 py-0.5 rounded-full border border-[#dce4e8]">
              Metric: {metricKey}
            </span>
          </div>
          <span className="text-[11px] text-[#8C9BA8] font-medium">
            Showing {Math.min(totalCount, 2)} of {totalCount} insights
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Left Arrow Button */}
          <button
            type="button"
            onClick={() => setCarouselIndex((prev) => Math.max(0, prev - 1))}
            disabled={carouselIndex === 0}
            className="size-[30px] rounded-full bg-white border border-[#CBD5E1] shadow-2xs flex items-center justify-center text-[#0e2841] hover:bg-[#F1F5F9] disabled:opacity-20 disabled:cursor-not-allowed shrink-0 transition-colors cursor-pointer"
            title="Previous Insights"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Cards Container */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 flex-1 min-w-0">
            {card1 && (
              <div className="flex flex-col min-w-0">
                <div className="bg-[#F8FAFC] rounded-[8px] p-2.5 sm:p-3 border border-[#E2E8F0] flex flex-col justify-between min-h-[72px] hover:border-[#0e2841]/40 transition-colors">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="font-['Poppins',sans-serif] font-bold text-[#0e2841] text-[12.5px] leading-tight truncate">
                        {card1.heading}
                      </h4>
                      <span
                        className={`text-[9.5px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                          card1.priority === "High"
                            ? "bg-red-50 text-red-600 border border-red-200"
                            : card1.priority === "Low"
                            ? "bg-blue-50 text-blue-600 border border-blue-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {card1.priority} Priority
                      </span>
                    </div>
                    <p className="text-[11.5px] leading-[16px] text-[#475569] line-clamp-2">
                      <span className="font-semibold text-[#1a1c1e]">
                        Observation:
                      </span>{" "}
                      {card1.insight}
                    </p>
                    <p className="text-[11.5px] leading-[16px] text-[#0e2841] font-medium mt-0.5 line-clamp-2">
                      <span className="font-semibold text-[#1a1c1e]">
                        Recommendation:
                      </span>{" "}
                      {card1.recommendation}
                    </p>
                  </div>
                </div>
                <p className="text-[11px] font-medium text-[#8C9BA8] text-center mt-1">
                  {carouselIndex + 1} of {totalCount}
                </p>
              </div>
            )}

            {card2 ? (
              <div className="flex flex-col min-w-0">
                <div className="bg-[#F8FAFC] rounded-[8px] p-2.5 sm:p-3 border border-[#E2E8F0] flex flex-col justify-between min-h-[72px] hover:border-[#0e2841]/40 transition-colors">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="font-['Poppins',sans-serif] font-bold text-[#0e2841] text-[12.5px] leading-tight truncate">
                        {card2.heading}
                      </h4>
                      <span
                        className={`text-[9.5px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                          card2.priority === "High"
                            ? "bg-red-50 text-red-600 border border-red-200"
                            : card2.priority === "Low"
                            ? "bg-blue-50 text-blue-600 border border-blue-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {card2.priority} Priority
                      </span>
                    </div>
                    <p className="text-[11.5px] leading-[16px] text-[#475569] line-clamp-2">
                      <span className="font-semibold text-[#1a1c1e]">
                        Observation:
                      </span>{" "}
                      {card2.insight}
                    </p>
                    <p className="text-[11.5px] leading-[16px] text-[#0e2841] font-medium mt-0.5 line-clamp-2">
                      <span className="font-semibold text-[#1a1c1e]">
                        Recommendation:
                      </span>{" "}
                      {card2.recommendation}
                    </p>
                  </div>
                </div>
                <p className="text-[11px] font-medium text-[#8C9BA8] text-center mt-1">
                  {carouselIndex + 2} of {totalCount}
                </p>
              </div>
            ) : totalCount > 1 ? (
              <div className="hidden md:block" />
            ) : null}
          </div>

          {/* Right Arrow Button */}
          <button
            type="button"
            onClick={() =>
              setCarouselIndex((prev) =>
                Math.min(totalCount - 2, prev + 1)
              )
            }
            disabled={carouselIndex >= totalCount - 2 || totalCount <= 2}
            className="size-[30px] rounded-full bg-white border border-[#CBD5E1] shadow-2xs flex items-center justify-center text-[#0e2841] hover:bg-[#F1F5F9] disabled:opacity-20 disabled:cursor-not-allowed shrink-0 transition-colors cursor-pointer"
            title="Next Insights"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  // Compact Property Bar for Cash Management & Capital Management (1028:5305 / 1028:5290)
  const renderCompactPropertyBar = () => (
    <div className="bg-white rounded-[12px] h-[60px] px-[20px] shadow-[0px_11px_18px_0px_rgba(0,0,0,0.04)] flex items-center justify-between">
      <div className="flex items-center gap-[14px]">
        <img
          src={currentProperty.image}
          alt={currentProperty.address}
          className="w-[44px] h-[44px] rounded-[4px] object-cover shrink-0"
        />
        <div>
          <p className="font-['Poppins',sans-serif] font-bold text-[#0e2841] text-[15px] leading-tight">
            {currentProperty.address}
          </p>
          <p className="font-['Poppins',sans-serif] font-semibold text-[#1a1c1e] text-[11.5px] mt-0.5">
            {currentProperty.subtitle}
          </p>
        </div>
      </div>
    </div>
  );

  const renderStatusBadge = () => {
    const isCompleted = reviewStatusState === "Completed";
    if (readOnly) {
      return (
        <div
          className={`border-[0.5px] border-solid flex h-[32px] items-center px-[14px] rounded-[68px] shadow-[0px_4px_7.3px_0px_rgba(0,0,0,0.06)] shrink-0 gap-[8px] select-none ${
            isCompleted
              ? "bg-[#EBF7EE] border-[#18794E] text-[#18794E]"
              : "bg-[rgba(246,231,179,0.39)] border-[#d79730] text-[#d79730]"
          }`}
        >
          {isCompleted ? (
            <CheckCircle2 className="size-[16px] text-[#18794E]" />
          ) : (
            <img
              src="/images/review/18912.svg"
              alt=""
              className="size-[16px]"
            />
          )}
          <span className="font-['Poppins',sans-serif] font-medium text-[12px] whitespace-nowrap">
            Status: {isCompleted ? "Completed" : "Review In Progress"}
          </span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2">
        {!isCompleted && (
          <button
            type="button"
            onClick={() => handleSetStatus("Completed")}
            className="h-[32px] px-3.5 bg-[#18794E] hover:bg-[#13613e] text-white text-[12px] font-semibold rounded-[68px] shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            title="Set status to Completed"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Set as &quot;Completed&quot;</span>
          </button>
        )}

        <div className="relative inline-block">
          <button
            type="button"
            onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
            className={`border-[0.5px] border-solid flex h-[32px] items-center justify-between px-[14px] rounded-[68px] shadow-[0px_4px_7.3px_0px_rgba(0,0,0,0.11)] shrink-0 min-w-[215px] gap-[8px] cursor-pointer transition-all ${
              isCompleted
                ? "bg-[#EBF7EE] border-[#18794E] text-[#18794E] hover:bg-[#dcf3e2]"
                : "bg-[rgba(246,231,179,0.39)] border-[#d79730] text-[#d79730] hover:bg-[rgba(246,231,179,0.55)]"
            }`}
            title="Click to set status as Completed or Review In Progress"
          >
            <div className="flex items-center gap-[8px]">
              {isCompleted ? (
                <CheckCircle2 className="size-[16px] text-[#18794E]" />
              ) : (
                <img
                  src="/images/review/18912.svg"
                  alt=""
                  className="size-[16px]"
                />
              )}
              <span className="font-['Poppins',sans-serif] font-medium text-[12px] whitespace-nowrap">
                Status: {isCompleted ? "Completed" : "Review In Progress"}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 opacity-70" />
          </button>

          {isStatusMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsStatusMenuOpen(false)}
              />
              <div className="absolute right-0 mt-1.5 w-[225px] bg-white rounded-[10px] shadow-2xl border border-[#CBD5E1] p-1.5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-2 py-1 text-[11px] font-semibold text-[#8C9BA8] uppercase border-b border-[#F1F5F9] mb-1">
                  Set Review Status
                </div>
                <button
                  type="button"
                  onClick={() => handleSetStatus("In Progress")}
                  className={`w-full flex items-center justify-between px-3 py-2 text-[12.5px] rounded-[6px] font-medium transition-colors cursor-pointer ${
                    !isCompleted
                      ? "bg-[rgba(246,231,179,0.35)] text-[#d79730]"
                      : "text-[#475569] hover:bg-[#F8FAFC]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#d79730]" />
                    <span>Review In Progress</span>
                  </div>
                  {!isCompleted && <Check className="w-3.5 h-3.5 text-[#d79730]" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleSetStatus("Completed")}
                  className={`w-full flex items-center justify-between px-3 py-2 text-[12.5px] rounded-[6px] font-medium transition-colors cursor-pointer mt-1 ${
                    isCompleted
                      ? "bg-[#EBF7EE] text-[#18794E]"
                      : "text-[#475569] hover:bg-[#F8FAFC]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#18794E]" />
                    <span className="font-semibold">Set as &quot;Completed&quot;</span>
                  </div>
                  {isCompleted && <Check className="w-3.5 h-3.5 text-[#18794E]" />}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-2.5 pb-4 font-['Poppins',sans-serif]">
      {/* ================================================================= */}
      {/* TOP HEADER & MAIN TABS (or Sub-screen Header for Cash/Capital)    */}
      {/* ================================================================= */}
      {activeTab === "property-analysis" &&
      propertySubView !== "overview" ? (
        <div>
          {/* Sub-screen breadcrumb (< Cash Management or < Capital Management) */}
          <button
            type="button"
            onClick={() => setPropertySubView("overview")}
            className="inline-flex items-center gap-[6px] text-[#434750] hover:text-[#0e2841] text-[14px] font-medium cursor-pointer mb-1"
          >
            <img
              src="/images/review/42c8e.svg"
              alt=""
              className="size-[16px]"
            />
            <span>
              {propertySubView === "cash-management"
                ? "Cash Management"
                : "Capital Management"}
            </span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-0.5">
            <div>
              <h1 className="font-['Poppins',sans-serif] font-semibold text-[#0e2841] text-[20px] sm:text-[22px] tracking-[-0.5px] leading-tight">
                {propertySubView === "cash-management"
                  ? "Cash Flow & Operational Efficiency"
                  : "Capital & Debt Management:"}
              </h1>
              <p className="text-[12.5px] text-[#6b6b6b] mt-0.5">
                {propertySubView === "cash-management"
                  ? "Rental yields, operating cash flows, tax shields and holding cost breakdown."
                  : "Equity compound returns, mortgage leverage, rate hedging,"}
              </p>
            </div>

            {renderStatusBadge()}
          </div>
        </div>
      ) : (
        <div>
          {/* Top Link: < Back to Review Workspace / Reports (1044:9331) */}
          <button
            type="button"
            onClick={onBack}
            className="flex gap-[4px] items-center cursor-pointer text-[#434750] hover:text-[#0e2841] text-[13px] leading-[18px] font-['Poppins',sans-serif] font-normal transition-colors"
          >
            <img
              src="/images/review/42c8e.svg"
              alt=""
              className="size-[15px]"
            />
            <span>Back to Reports</span>
          </button>

          {/* Title & Status Pill Row (1044:9335) — directly on page without card border */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-h-[46px] py-0.5">
            <h1 className="font-['Poppins',sans-serif] font-semibold text-[#0e2841] text-[19px] sm:text-[21px] leading-snug tracking-[-0.4px]">
              The Property Investor CFO Annual Report – {householdName || "Harrison Household"} FY{reviewYear}
            </h1>

            {renderStatusBadge()}
          </div>

          {/* 5 Main Views Tabs (1044:9348) — Solid navy active tab on #f2f1f2 background */}
          <div className="mt-1 bg-[#f2f1f2] inline-flex flex-wrap gap-[4px] h-[38px] items-center p-[3px] rounded-[8px]">
            {[
              { id: "executive-summary", label: "Executive Summary" },
              { id: "portfolio-overview", label: "Portfolio Overview" },
              { id: "property-analysis", label: "Property Analysis" },
              { id: "future-outlook", label: "Interactive Future Outlook" },
              {
                id: "insights",
                label: `Portfolio Management Insights (${insights.length})`,
              },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id as typeof activeTab);
                    if (tab.id === "property-analysis") {
                      setPropertySubView("overview");
                    }
                  }}
                  className={`h-[32px] px-[14px] text-[12.5px] tracking-[-0.2px] transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#0e2841] text-white font-semibold rounded-[6px] shadow-2xs"
                      : "bg-transparent text-[#64748B] hover:text-[#0e2841] font-medium"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 1: EXECUTIVE SUMMARY (Figma 788:3103)                         */}
      {/* ================================================================= */}
      {activeTab === "executive-summary" && (
        <div className="space-y-6 pt-1">
          {/* Top Control Bar: Edit All Screen Text Toggle */}
          {canEdit && (
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[#64748B]">
                Review &amp; customize the executive analysis for FY{reviewYear}
              </span>
              <button
                type="button"
                onClick={() => {
                  const next = !isEditingAllExec;
                  setIsEditingAllExec(next);
                  if (!next) {
                    persistReviewField({
                      verdictText,
                      objectiveText,
                      portfolioCommentary,
                      propertyCommentary,
                      bottomLineText,
                      executiveSummary: JSON.stringify(execData),
                    });
                  }
                }}
                className={`h-[34px] px-3.5 rounded-[8px] text-[12.5px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isEditingAllExec
                    ? "bg-[#18794E] text-white hover:bg-[#13613e] shadow-xs"
                    : "bg-white border border-[#CBD5E1] text-[#0e2841] hover:bg-[#F1F5F9] shadow-2xs"
                }`}
              >
                {isEditingAllExec ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Done Editing Screen Text</span>
                  </>
                ) : (
                  <>
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit All Screen Text</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Card 1: Portfolio Performance & Strategic Roles (813:10033) */}
          <div className="bg-white rounded-[12px] p-[22px] shadow-[0px_11px_18px_0px_rgba(0,0,0,0.04)]">
            <h2 className="text-[18px] font-bold text-[#0e2841] tracking-[-0.36px] mb-4">
              Portfolio Performance &amp; Strategic Roles
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-[24px]">
              {/* Left: CEO / Lead Adviser Verdict (813:10037) */}
              <div className="bg-[#f6f9fb] rounded-[12px] p-[20px]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[16px] font-semibold text-[#0e2841]">
                    CEO / Lead Adviser Verdict
                  </h3>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => setIsEditingVerdict(!isEditingVerdict)}
                      className="p-1 text-[#6b6b6b] hover:text-[#0e2841] transition-colors cursor-pointer flex items-center gap-1 text-[12px]"
                      title="Edit Verdict"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>{isEditingVerdict ? "Done" : "Edit"}</span>
                    </button>
                  )}
                </div>
                {canEdit && (isEditingVerdict || isEditingAllExec) ? (
                  <div className="space-y-2">
                    <textarea
                      rows={4}
                      value={verdictText}
                      onChange={(e) => setVerdictText(e.target.value)}
                      className="w-full bg-white border border-[#0e2841] rounded-[8px] p-3 text-[13.5px] leading-[22px] text-[#1a1c1e] focus:outline-none"
                      placeholder="Enter CEO / Lead Adviser verdict..."
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingVerdict(false)}
                        className="px-2.5 py-1 text-[12px] text-[#64748B] hover:text-[#0e2841] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await persistReviewField({ verdictText });
                          setIsEditingVerdict(false);
                        }}
                        className="px-3.5 py-1.5 bg-[#0e2841] hover:bg-[#163859] text-white rounded-[6px] text-[12px] font-medium cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Save Verdict</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <p
                    onClick={() => canEdit && setIsEditingVerdict(true)}
                    className={`text-[13.5px] leading-[22px] text-[#434750] p-1 -m-1 rounded transition-colors ${
                      canEdit ? "cursor-pointer hover:bg-black/[0.02]" : ""
                    }`}
                    title={canEdit ? "Click to edit verdict" : undefined}
                  >
                    {verdictText}
                  </p>
                )}
              </div>

              {/* Right: Your Objective (813:10041) */}
              <div className="bg-[#f6f9fb] rounded-[12px] p-[20px]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[16px] font-semibold text-[#0e2841]">
                    Your Objective
                  </h3>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => setIsEditingObjective(!isEditingObjective)}
                      className="p-1 text-[#6b6b6b] hover:text-[#0e2841] transition-colors cursor-pointer flex items-center gap-1 text-[12px]"
                      title="Edit Objective"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>{isEditingObjective ? "Done" : "Edit"}</span>
                    </button>
                  )}
                </div>
                {canEdit && (isEditingObjective || isEditingAllExec) ? (
                  <div className="space-y-2">
                    <textarea
                      rows={4}
                      value={objectiveText}
                      onChange={(e) => setObjectiveText(e.target.value)}
                      className="w-full bg-white border border-[#0e2841] rounded-[8px] p-3 text-[13.5px] leading-[22px] text-[#1a1c1e] focus:outline-none"
                      placeholder="Enter objective..."
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingObjective(false)}
                        className="px-2.5 py-1 text-[12px] text-[#64748B] hover:text-[#0e2841] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await persistReviewField({ objectiveText });
                          setIsEditingObjective(false);
                        }}
                        className="px-3.5 py-1.5 bg-[#0e2841] hover:bg-[#163859] text-white rounded-[6px] text-[12px] font-medium cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Save Objective</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <p
                    onClick={() => canEdit && setIsEditingObjective(true)}
                    className={`text-[13.5px] leading-[22px] text-[#434750] p-1 -m-1 rounded transition-colors ${
                      canEdit ? "cursor-pointer hover:bg-black/[0.02]" : ""
                    }`}
                    title={canEdit ? "Click to edit objective" : undefined}
                  >
                    {objectiveText}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section Heading: Portfolio Overview (813:10691) */}
          <h2 className="text-[20px] font-semibold text-[#0e2841] tracking-[-0.4px] pt-1">
            Portfolio Overview
          </h2>

          {/* Card 2: Portfolio Return Benchmarks + 4 Metric Cards + Commentary (813:10048) */}
          <div className="bg-white rounded-[12px] p-[22px] shadow-[0px_11px_18px_0px_rgba(0,0,0,0.04)] space-y-6">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="w-full lg:w-[320px] flex flex-col justify-center pl-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[14px] font-medium text-[#6b6b6b]">
                    Portfolio Return Benchmarks
                  </span>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => setIsEditingMetrics(!isEditingMetrics)}
                      className="p-1 text-[#6b6b6b] hover:text-[#0e2841] transition-colors cursor-pointer"
                      title="Edit Return & Metrics"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {canEdit && (isEditingMetrics || isEditingAllExec) ? (
                  <div className="space-y-2 mt-1">
                    <div>
                      <label className="text-[11px] text-[#6b6b6b] block">
                        Total Return Rate
                      </label>
                      <input
                        type="text"
                        value={execData.totalReturnVal || "6.8%"}
                        onChange={(e) =>
                          updateExecData({ totalReturnVal: e.target.value })
                        }
                        className="text-[24px] font-bold text-[#0e2841] w-full px-2.5 py-1 bg-white border border-[#0e2841] rounded-[6px]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-[#6b6b6b] block">
                        Subtitle
                      </label>
                      <input
                        type="text"
                        value={
                          execData.totalReturnSub ||
                          `Total Return (FY${reviewYear || 2026})`
                        }
                        onChange={(e) =>
                          updateExecData({ totalReturnSub: e.target.value })
                        }
                        className="text-[12px] text-[#6b6b6b] w-full px-2 py-1 bg-white border border-[#CBD5E1] rounded-[6px]"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <span
                      onClick={() => setIsEditingMetrics(true)}
                      className="text-[40px] font-bold text-[#0e2841] leading-tight mt-1 cursor-pointer hover:underline"
                      title="Click to edit total return"
                    >
                      {execData.totalReturnVal || "6.8%"}
                    </span>
                    <span className="text-[13px] text-[#6b6b6b] mt-0.5">
                      {execData.totalReturnSub ||
                        `Total Return (FY${reviewYear || 2026})`}
                    </span>
                  </>
                )}
              </div>

              <div className="hidden lg:block w-[1px] h-[141px] bg-[#dce4e8]" />

              {/* Benchmark Comparison Horizontal Bars (813:10054) */}
              <div className="flex-1 w-full bg-[#f6f9fb] rounded-[10px] p-5">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[14px] font-semibold text-[#0e2841]">
                    Benchmark Comparison
                  </span>
                  <span className="text-[12px] font-medium text-[#6b6b6b]">
                    Annual Return
                  </span>
                </div>

                <div
                  onMouseLeave={() => setHoveredExecBenchmark(null)}
                  className="space-y-3.5"
                >
                  {[
                    {
                      label: "Your Properties",
                      width: "75%",
                      color: "bg-[#0e2841]",
                      val: "15,937",
                      pct: `${execData.totalReturnVal || "6.8%"} p.a.`,
                    },
                    {
                      label: "Similar Properties",
                      width: "26%",
                      color: "bg-[#0e2841]/70",
                      val: "15,937",
                      pct: "4.1% p.a.",
                    },
                    {
                      label: "Shares (ASX 200)",
                      width: "44%",
                      color: "bg-[#0e2841]/85",
                      val: "15,937",
                      pct: "5.5% p.a.",
                    },
                    {
                      label: "Term Deposit",
                      width: "66%",
                      color: "bg-[#0e2841]",
                      val: "15,937",
                      pct: "4.5% p.a.",
                    },
                  ].map((b) => {
                    const isHovered = hoveredExecBenchmark === b.label;
                    const isDimmed =
                      hoveredExecBenchmark !== null &&
                      hoveredExecBenchmark !== b.label;
                    return (
                      <div
                        key={b.label}
                        onMouseEnter={() => setHoveredExecBenchmark(b.label)}
                        className={`relative flex items-center gap-3 text-[12px] rounded-[6px] px-1.5 py-1 -mx-1.5 transition-all duration-150 cursor-pointer ${
                          isHovered ? "bg-white shadow-2xs" : ""
                        } ${isDimmed ? "opacity-55" : "opacity-100"}`}
                      >
                        <span
                          className={`w-[115px] shrink-0 transition-colors ${
                            isHovered
                              ? "text-[#0e2841] font-semibold"
                              : "text-[#1a1c1e] font-medium"
                          }`}
                        >
                          {b.label}
                        </span>
                        <div className="flex-1 flex items-center gap-2.5">
                          <div
                            style={{ width: b.width }}
                            className={`h-[12px] rounded-[4px] transition-all duration-150 ${
                              isHovered
                                ? "bg-[#1255ad] shadow-[0px_3px_8px_rgba(18,85,173,0.28)]"
                                : b.color
                            }`}
                          />
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className={`w-[7px] h-[7px] rounded-full transition-colors ${
                                isHovered ? "bg-[#1255ad]" : "bg-[#0e2841]"
                              }`}
                            />
                            <span
                              className={`text-[11px] font-semibold transition-colors ${
                                isHovered ? "text-[#0e2841]" : "text-[#6b6b6b]"
                              }`}
                            >
                              {isHovered ? `${b.val} (${b.pct})` : b.val}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 4 Metric Cards Row (813:10092) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[14px]">
              {(execData.metricCards || defaultExecData.metricCards!).map(
                (card, idx) => {
                  const icons = [
                    "/images/review/90cea.svg",
                    "/images/review/38829.svg",
                    "/images/review/89393.svg",
                    "/images/review/61b85.svg",
                  ];
                  const iconSrc = icons[idx % icons.length];
                  if (canEdit && (isEditingMetrics || isEditingAllExec)) {
                    return (
                      <div
                        key={idx}
                        className="bg-[#f6f9fb] rounded-[12px] p-4 space-y-2 border border-[#CBD5E1]"
                      >
                        <div>
                          <label className="text-[10.5px] font-semibold text-[#6b6b6b] block">
                            Title
                          </label>
                          <input
                            type="text"
                            value={card.title}
                            onChange={(e) => {
                              const next = [
                                ...(execData.metricCards ||
                                  defaultExecData.metricCards!),
                              ];
                              next[idx] = {
                                ...next[idx],
                                title: e.target.value,
                              };
                              updateExecData({ metricCards: next });
                            }}
                            className="w-full text-[12px] font-medium text-[#1a1c1e] bg-white border border-[#CBD5E1] rounded px-2 py-1 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10.5px] font-semibold text-[#6b6b6b] block">
                            Value
                          </label>
                          <input
                            type="text"
                            value={card.val}
                            onChange={(e) => {
                              const next = [
                                ...(execData.metricCards ||
                                  defaultExecData.metricCards!),
                              ];
                              next[idx] = { ...next[idx], val: e.target.value };
                              updateExecData({ metricCards: next });
                            }}
                            className="w-full text-[16px] font-bold text-[#0e2841] bg-white border border-[#CBD5E1] rounded px-2 py-1 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10.5px] font-semibold text-[#6b6b6b] block">
                            Comparison
                          </label>
                          <input
                            type="text"
                            value={card.comp}
                            onChange={(e) => {
                              const next = [
                                ...(execData.metricCards ||
                                  defaultExecData.metricCards!),
                              ];
                              next[idx] = { ...next[idx], comp: e.target.value };
                              updateExecData({ metricCards: next });
                            }}
                            className="w-full text-[11px] text-[#6b6b6b] bg-white border border-[#CBD5E1] rounded px-2 py-1 focus:outline-none"
                          />
                        </div>
                      </div>
                    );
                  }
                  return renderMetricCard(
                    card.title,
                    card.val,
                    card.comp,
                    iconSrc
                  );
                }
              )}
            </div>

            {/* Commentary Box (899:8185) */}
            <div className="bg-[#f6f9fb] rounded-[12px] p-[22px]">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[16px] font-semibold text-[#0e2841]">
                  commentary
                </span>
                {canEdit && <Pencil className="w-3.5 h-3.5 text-[#6b6b6b]" />}
              </div>
              <div className="bg-white border border-[#dce4e8] rounded-[8px] min-h-[56px] px-4 flex items-center justify-between py-2">
                {canEdit ? (
                  <input
                    type="text"
                    value={portfolioCommentary}
                    onChange={(e) => setPortfolioCommentary(e.target.value)}
                    onBlur={() => persistReviewField({ portfolioCommentary })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter")
                        persistReviewField({ portfolioCommentary });
                    }}
                    placeholder="Add your commentary here"
                    className="w-full text-[13.5px] text-[#1a1c1e] placeholder:text-[#a0a0a0] focus:outline-none bg-transparent"
                  />
                ) : (
                  <span className="text-[13.5px] text-[#1a1c1e]">
                    {portfolioCommentary || "No commentary recorded."}
                  </span>
                )}
                {canEdit && <ChevronDown className="w-4 h-4 text-[#6b6b6b] shrink-0" />}
              </div>
            </div>
          </div>

          {/* Card 3: Property Performance & Strategic Role (813:10209) */}
          <div className="bg-white rounded-[12px] p-[22px] shadow-[0px_11px_18px_0px_rgba(0,0,0,0.04)] space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-bold text-[#0e2841] tracking-[-0.36px]">
                Property Performance &amp; Strategic Role
              </h3>
              {canEdit && (
                <span className="text-[12px] text-[#64748B]">
                  {isEditingAllExec
                    ? "Editing Strategic Roles below"
                    : "Click role to edit"}
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="border-b border-[#F0F1F3] text-[12.5px] font-medium text-[#8C9BA8]">
                    <th className="py-3.5 px-3">Property</th>
                    <th className="py-3.5 px-3">Current Value</th>
                    <th className="py-3.5 px-3">Net Yield</th>
                    <th className="py-3.5 px-3">Total Return</th>
                    <th className="py-3.5 px-3">After-Tax Cash Flow</th>
                    <th className="py-3.5 px-3">Strategic Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F6F7F9] text-[13.5px] text-[#1A1C1E]">
                  {propertiesList.map((prop) => {
                    const currentRole =
                      execData.propertyStrategicRoles?.[prop.id] ??
                      (prop.isOwnerOccupied
                        ? "Primary Residence"
                        : "Core Growth & Yield");
                    return (
                      <tr
                        key={prop.id}
                        className="hover:bg-[#FBFBFC] transition-colors"
                      >
                        <td className="py-4 px-3 font-medium">
                          {prop.address}
                        </td>
                        <td className="py-4 px-3">{prop.propertyValue}</td>
                        <td className="py-4 px-3">
                          {prop.isOwnerOccupied ? "N/A" : "3.8%"}
                        </td>
                        <td className="py-4 px-3 font-semibold text-[#15803D]">
                          {prop.totalReturn}
                        </td>
                        <td className="py-4 px-3">
                          {prop.isOwnerOccupied ? "N/A" : "-$12,400"}
                        </td>
                        <td className="py-4 px-3 font-medium text-[#0e2841]">
                          {canEdit && isEditingAllExec ? (
                            <input
                              type="text"
                              value={currentRole}
                              onChange={(e) => {
                                const nextRoles = {
                                  ...(execData.propertyStrategicRoles || {}),
                                  [prop.id]: e.target.value,
                                };
                                updateExecData({
                                  propertyStrategicRoles: nextRoles,
                                });
                              }}
                              className="text-[12.5px] bg-white border border-[#0e2841] rounded px-2 py-1 w-full max-w-[200px] focus:outline-none"
                            />
                          ) : (
                            <span
                              onClick={() => canEdit && setIsEditingAllExec(true)}
                              className={canEdit ? "cursor-pointer hover:underline" : ""}
                              title={canEdit ? "Click to edit strategic role" : undefined}
                            >
                              {currentRole}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Commentary Box (899:8199) */}
            <div className="bg-[#f6f9fb] rounded-[12px] p-[22px]">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[16px] font-semibold text-[#0e2841]">
                  commentary
                </span>
                {canEdit && <Pencil className="w-3.5 h-3.5 text-[#6b6b6b]" />}
              </div>
              <div className="bg-white border border-[#dce4e8] rounded-[8px] min-h-[56px] px-4 flex items-center justify-between py-2">
                {canEdit ? (
                  <input
                    type="text"
                    value={propertyCommentary}
                    onChange={(e) => setPropertyCommentary(e.target.value)}
                    onBlur={() => persistReviewField({ propertyCommentary })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter")
                        persistReviewField({ propertyCommentary });
                    }}
                    placeholder="Add your commentary here"
                    className="w-full text-[13.5px] text-[#1a1c1e] placeholder:text-[#a0a0a0] focus:outline-none bg-transparent"
                  />
                ) : (
                  <span className="text-[13.5px] text-[#1a1c1e]">
                    {propertyCommentary || "No commentary recorded."}
                  </span>
                )}
                {canEdit && <ChevronDown className="w-4 h-4 text-[#6b6b6b] shrink-0" />}
              </div>
            </div>
          </div>

          {/* Section Heading: Strategy, Opportunities & Outlook (813:9744) */}
          <h2 className="text-[20px] font-semibold text-[#0e2841] tracking-[-0.4px] pt-1">
            Strategy, Opportunities &amp; Outlook
          </h2>

          {/* Card 4: Three Biggest Portfolio Opportunities & Key Risks to Manage (788:3756) */}
          <div className="bg-white rounded-[12px] p-[22px] shadow-[0px_11px_18px_0px_rgba(0,0,0,0.04)]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-[28px]">
              {/* Left: Three Biggest Portfolio Opportunities */}
              <div className="bg-[#f6f9fb] rounded-[12px] p-[20px]">
                <div className="flex items-center justify-between pb-4 border-b border-[#dce4e8]">
                  <h3 className="text-[17px] font-semibold text-[#0e2841]">
                    Three Biggest Portfolio Opportunities
                  </h3>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => setIsEditingOpps(!isEditingOpps)}
                      className="p-1 text-[#6b6b6b] hover:text-[#0e2841] transition-colors cursor-pointer"
                      title="Edit Opportunities"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="divide-y divide-[#dce4e8]">
                  {(
                    execData.opportunities || defaultExecData.opportunities!
                  ).map((opp, idx) => (
                    <div key={idx} className="py-4 first:pt-4 last:pb-1">
                      {canEdit && (isEditingOpps || isEditingAllExec) ? (
                        <div className="space-y-1.5">
                          <input
                            type="text"
                            value={opp.title}
                            onChange={(e) => {
                              const next = [
                                ...(execData.opportunities ||
                                  defaultExecData.opportunities!),
                              ];
                              next[idx] = {
                                ...next[idx],
                                title: e.target.value,
                              };
                              updateExecData({ opportunities: next });
                            }}
                            className="w-full text-[13.5px] font-semibold text-[#0e2841] bg-white border border-[#CBD5E1] rounded px-2 py-1"
                            placeholder="Title"
                          />
                          <textarea
                            rows={2}
                            value={opp.desc}
                            onChange={(e) => {
                              const next = [
                                ...(execData.opportunities ||
                                  defaultExecData.opportunities!),
                              ];
                              next[idx] = {
                                ...next[idx],
                                desc: e.target.value,
                              };
                              updateExecData({ opportunities: next });
                            }}
                            className="w-full text-[12px] text-[#475569] bg-white border border-[#CBD5E1] rounded px-2 py-1"
                            placeholder="Description"
                          />
                          <input
                            type="text"
                            value={opp.amount}
                            onChange={(e) => {
                              const next = [
                                ...(execData.opportunities ||
                                  defaultExecData.opportunities!),
                              ];
                              next[idx] = {
                                ...next[idx],
                                amount: e.target.value,
                              };
                              updateExecData({ opportunities: next });
                            }}
                            className="w-full text-[13.5px] font-bold text-[#15803D] bg-white border border-[#CBD5E1] rounded px-2 py-1"
                            placeholder="Amount (e.g. $15,100 p.a.)"
                          />
                        </div>
                      ) : (
                        <>
                          <p className="text-[14.5px] font-semibold text-[#0e2841]">
                            {opp.title}
                          </p>
                          <p className="text-[12.5px] text-[#6b6b6b] mt-1">
                            {opp.desc}
                          </p>
                          <p className="text-[14.5px] font-bold text-[#15803D] mt-1.5">
                            {opp.amount}
                          </p>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Key Risks to Manage */}
              <div className="bg-[#f6f9fb] rounded-[12px] p-[20px]">
                <div className="flex items-center justify-between pb-4 border-b border-[#dce4e8]">
                  <h3 className="text-[17px] font-semibold text-[#0e2841]">
                    Key Risks to Manage
                  </h3>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => setIsEditingRisks(!isEditingRisks)}
                      className="p-1 text-[#6b6b6b] hover:text-[#0e2841] transition-colors cursor-pointer"
                      title="Edit Risks"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="divide-y divide-[#dce4e8]">
                  {(execData.risks || defaultExecData.risks!).map(
                    (risk, idx) => (
                      <div
                        key={idx}
                        className="py-4 first:pt-4 last:pb-1 flex items-start gap-3.5"
                      >
                        <div className="w-[40px] h-[40px] rounded-full bg-white border border-[#dce4e8] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                          <Clock className="w-5 h-5 text-[#0e2841]" />
                        </div>
                        <div className="flex-1">
                          {canEdit && (isEditingRisks || isEditingAllExec) ? (
                            <div className="space-y-1.5">
                              <input
                                type="text"
                                value={risk.title}
                                onChange={(e) => {
                                  const next = [
                                    ...(execData.risks ||
                                      defaultExecData.risks!),
                                  ];
                                  next[idx] = {
                                    ...next[idx],
                                    title: e.target.value,
                                  };
                                  updateExecData({ risks: next });
                                }}
                                className="w-full text-[13.5px] font-semibold text-[#0e2841] bg-white border border-[#CBD5E1] rounded px-2 py-1"
                                placeholder="Risk Title"
                              />
                              <textarea
                                rows={2}
                                value={risk.desc}
                                onChange={(e) => {
                                  const next = [
                                    ...(execData.risks ||
                                      defaultExecData.risks!),
                                  ];
                                  next[idx] = {
                                    ...next[idx],
                                    desc: e.target.value,
                                  };
                                  updateExecData({ risks: next });
                                }}
                                className="w-full text-[12px] text-[#475569] bg-white border border-[#CBD5E1] rounded px-2 py-1"
                                placeholder="Risk Description"
                              />
                            </div>
                          ) : (
                            <>
                              <p className="text-[14.5px] font-semibold text-[#0e2841]">
                                {risk.title}
                              </p>
                              <p className="text-[12.5px] text-[#6b6b6b] mt-1 leading-relaxed">
                                {risk.desc}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Card 5: Are You on Track? (1044:11670) */}
          <div className="bg-white rounded-[12px] p-[26px] shadow-[0px_11px_18px_0px_rgba(0,0,0,0.04)]">
            <div className="flex flex-col lg:flex-row gap-[28px] items-stretch">
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#dce4e8]">
                  <div className="flex items-center gap-3">
                    <div className="w-[47px] h-[47px] rounded-full bg-[#f6f9fb] border border-[#dce4e8] flex items-center justify-center">
                      <Clock className="w-5 h-5 text-[#0e2841]" />
                    </div>
                    <h3 className="text-[17px] font-semibold text-[#0e2841]">
                      Are You on Track?
                    </h3>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => setIsEditingTrack(!isEditingTrack)}
                        className="p-1 text-[#6b6b6b] hover:text-[#0e2841] transition-colors cursor-pointer"
                        title="Edit Goals &amp; Narrative"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {canEdit && (isEditingTrack || isEditingAllExec) ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-[#6b6b6b]">Goal:</span>
                      <input
                        type="text"
                        value={execData.trackGoal || "$120,000 p.a."}
                        onChange={(e) =>
                          updateExecData({ trackGoal: e.target.value })
                        }
                        className="bg-white border border-[#0e2841] text-[#0e2841] h-[36px] px-3 rounded-[6px] text-[13px] font-medium"
                      />
                    </div>
                  ) : (
                    <div className="bg-[#0e2841] text-white h-[40px] px-[21px] rounded-[8px] text-[13.5px] font-medium flex items-center">
                      Goal: {execData.trackGoal || "$120,000 p.a."}
                    </div>
                  )}
                </div>

                {/* Current path */}
                <div
                  onMouseEnter={() => setHoveredTrackPath("current")}
                  onMouseLeave={() => setHoveredTrackPath(null)}
                  className="relative py-5 border-b border-[#dce4e8] cursor-pointer"
                >
                  {hoveredTrackPath === "current" && (
                    <div className="absolute top-1 left-[50%] -translate-x-1/2 bg-[#0e2841] text-white text-[11px] font-semibold px-3 py-1 rounded-[6px] shadow-md whitespace-nowrap z-20 pointer-events-none">
                      93.3% of {execData.trackGoal || "$120,000 p.a."} goal
                    </div>
                  )}
                  <div className="flex items-center justify-between max-w-[509px] text-[13px] mb-2.5">
                    <span className="text-[#434750] font-medium">
                      Current path:
                    </span>
                    {canEdit && (isEditingTrack || isEditingAllExec) ? (
                      <input
                        type="text"
                        value={execData.trackCurrentPathVal || "$112,000"}
                        onChange={(e) =>
                          updateExecData({
                            trackCurrentPathVal: e.target.value,
                          })
                        }
                        className="font-bold text-[#0e2841] text-[13px] bg-white border border-[#CBD5E1] rounded px-2 py-0.5 w-[110px]"
                      />
                    ) : (
                      <span className="font-bold text-[#0e2841]">
                        {execData.trackCurrentPathVal || "$112,000"}
                      </span>
                    )}
                  </div>
                  <div className="w-full h-[14px] bg-[#E5E7EB] rounded-full overflow-hidden">
                    <div
                      className={`w-[68%] h-full rounded-full transition-colors duration-150 ${
                        hoveredTrackPath === "current"
                          ? "bg-[#1255ad]"
                          : "bg-[#0e2841]"
                      }`}
                    />
                  </div>
                </div>

                {/* With key actions */}
                <div
                  onMouseEnter={() => setHoveredTrackPath("actions")}
                  onMouseLeave={() => setHoveredTrackPath(null)}
                  className="relative pt-5 cursor-pointer"
                >
                  {hoveredTrackPath === "actions" && (
                    <div className="absolute top-1 left-[50%] -translate-x-1/2 bg-[#0e2841] text-white text-[11px] font-semibold px-3 py-1 rounded-[6px] shadow-md whitespace-nowrap z-20 pointer-events-none">
                      110.0% of {execData.trackGoal || "$120,000 p.a."} goal
                    </div>
                  )}
                  <div className="flex items-center justify-between max-w-[663px] text-[13px] mb-2.5">
                    <span className="text-[#434750] font-medium">
                      With key actions:
                    </span>
                    {canEdit && (isEditingTrack || isEditingAllExec) ? (
                      <input
                        type="text"
                        value={execData.trackActionsVal || "$132,000"}
                        onChange={(e) =>
                          updateExecData({
                            trackActionsVal: e.target.value,
                          })
                        }
                        className="font-bold text-[#15803D] text-[13px] bg-white border border-[#CBD5E1] rounded px-2 py-0.5 w-[110px]"
                      />
                    ) : (
                      <span className="font-bold text-[#15803D]">
                        {execData.trackActionsVal || "$132,000"}
                      </span>
                    )}
                  </div>
                  <div className="w-full h-[14px] bg-[#E5E7EB] rounded-full overflow-hidden">
                    <div
                      className={`w-[91%] h-full rounded-full transition-colors duration-150 ${
                        hoveredTrackPath === "actions"
                          ? "bg-[#15803D]"
                          : "bg-[#0e2841]"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Right Card: on Track? (1044:11716) */}
              <div className="w-full lg:w-[330px] bg-[#f6f9fb] rounded-[12px] p-[20px] flex flex-col justify-between">
                <div className="flex items-center gap-3 pb-4 border-b border-[#dce4e8]">
                  <div className="w-[50px] h-[50px] rounded-full bg-white border border-[#dce4e8] flex items-center justify-center shrink-0">
                    <Route className="w-5 h-5 text-[#0e2841]" />
                  </div>
                  <h4 className="text-[17px] font-semibold text-[#0e2841]">
                    on Track?
                  </h4>
                </div>
                {canEdit && (isEditingTrack || isEditingAllExec) ? (
                  <textarea
                    rows={4}
                    value={
                      execData.trackNarrative ||
                      "With the identified actions, your portfolio could provide around $132,000 p.a. in 20 years, above your $120,000 target."
                    }
                    onChange={(e) =>
                      updateExecData({ trackNarrative: e.target.value })
                    }
                    className="w-full text-[13px] leading-[20px] text-[#434750] bg-white border border-[#CBD5E1] rounded p-2.5 mt-3 focus:outline-none"
                  />
                ) : (
                  <p className="text-[13.5px] leading-[22px] text-[#434750] pt-4">
                    {execData.trackNarrative ||
                      "With the identified actions, your portfolio could provide around $132,000 p.a. in 20 years, above your $120,000 target."}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Card 6: Three Priority Initiatives (791:9276) */}
          <div className="bg-white rounded-[12px] p-[26px] shadow-[0px_11px_18px_0px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <h3 className="text-[18px] font-bold text-[#0e2841]">
                  Three Priority Initiatives
                </h3>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setIsEditingInitiatives(!isEditingInitiatives)}
                    className="p-1 text-[#6b6b6b] hover:text-[#0e2841] transition-colors cursor-pointer"
                    title="Edit Initiatives"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-[16px]">
              {(execData.initiatives || defaultExecData.initiatives!).map(
                (item, idx) => (
                  <div
                    key={idx}
                    className="bg-[#f6f9fb] rounded-[10px] p-[20px]"
                  >
                    {canEdit && (isEditingInitiatives || isEditingAllExec) ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => {
                            const next = [
                              ...(execData.initiatives ||
                                defaultExecData.initiatives!),
                            ];
                            next[idx] = { ...next[idx], title: e.target.value };
                            updateExecData({ initiatives: next });
                          }}
                          className="w-full text-[13.5px] font-semibold text-[#0e2841] bg-white border border-[#CBD5E1] rounded px-2 py-1"
                          placeholder="Initiative Title"
                        />
                        <textarea
                          rows={2}
                          value={item.desc}
                          onChange={(e) => {
                            const next = [
                              ...(execData.initiatives ||
                                defaultExecData.initiatives!),
                            ];
                            next[idx] = { ...next[idx], desc: e.target.value };
                            updateExecData({ initiatives: next });
                          }}
                          className="w-full text-[12px] text-[#6b6b6b] bg-white border border-[#CBD5E1] rounded px-2 py-1"
                          placeholder="Initiative Description"
                        />
                      </div>
                    ) : (
                      <>
                        <p className="text-[14.5px] font-semibold text-[#0e2841]">
                          {item.title}
                        </p>
                        <p className="text-[13px] text-[#6b6b6b] mt-2 leading-relaxed">
                          {item.desc}
                        </p>
                      </>
                    )}
                  </div>
                )
              )}
            </div>
          </div>

          {/* Card 7: THE BOTTOM LINE (791:9442) */}
          <div className="bg-white rounded-[12px] p-[26px] shadow-[0px_11px_18px_0px_rgba(0,0,0,0.04)]">
            <h3 className="text-[18px] font-bold text-[#0e2841] mb-4">
              THE BOTTOM LINE
            </h3>
            {canEdit ? (
              <div className="bg-[#f6f9fb] border border-[#dce4e8] rounded-[8px] h-[61px] px-4 flex items-center justify-between">
                <input
                  type="text"
                  value={bottomLineText}
                  onChange={(e) => setBottomLineText(e.target.value)}
                  onBlur={() => persistReviewField({ bottomLineText })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") persistReviewField({ bottomLineText });
                  }}
                  className="w-full text-[13.5px] text-[#1a1c1e] focus:outline-none bg-transparent"
                />
                <ChevronDown className="w-4 h-4 text-[#6b6b6b] shrink-0" />
              </div>
            ) : (
              <div className="bg-[#f6f9fb] border border-[#dce4e8] rounded-[8px] min-h-[61px] px-4 py-3 flex items-center">
                <p className="text-[13.5px] text-[#1a1c1e] font-normal leading-relaxed">
                  {bottomLineText}
                </p>
              </div>
            )}
          </div>

          {/* Bottom Insights Carousel for Executive Summary */}
          {renderInsightsCarousel(selectedMetric, "Portfolio-Wide")}
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 2: PORTFOLIO OVERVIEW (Figma 1044:10511)                      */}
      {/* ================================================================= */}
      {activeTab === "portfolio-overview" && (
        <div className="space-y-6 pt-1">
          {/* Secondary Sub-tabs (1044:10593) & + Add Insight button (1044:11806) */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="bg-[#f2f1f2] rounded-[8px] p-[6.5px] inline-flex items-center gap-[6px] h-[53px]">
              {(["Summary", "Property", "Equity", "Cash"] as const).map(
                (sub) => {
                  const isActive = portfolioSubTab === sub;
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setPortfolioSubTab(sub)}
                      className={`h-[40px] px-[20px] text-[14px] tracking-[-0.28px] transition-all cursor-pointer ${
                        isActive
                          ? "bg-white rounded-[4px] font-semibold text-[#1a1c1e] shadow-2xs"
                          : "bg-transparent rounded-[6px] font-medium text-[#a0a0a0] hover:text-[#1a1c1e]"
                      }`}
                    >
                      {sub}
                    </button>
                  );
                }
              )}
            </div>

            {canEdit && (
              <button
                type="button"
                onClick={() => openAddInsightModal()}
                className="bg-[#0e2841] hover:bg-[#163859] text-white h-[40px] w-[177px] rounded-[8px] text-[14px] font-medium flex items-center justify-center transition-colors cursor-pointer"
              >
                + Add Insight
              </button>
            )}
          </div>

          {/* ========================================================================= */}
          {/* SUB-TAB 1: Summary (Balance Sheet & Contribution)                        */}
          {/* ========================================================================= */}
          {portfolioSubTab === "Summary" && (
            <div className="space-y-6">
              {/* Portfolio Summary (Balance Sheet) (1044:10771) */}
              <div className="bg-white rounded-[12px] p-[20px] shadow-[0px_11px_18px_0px_rgba(0,0,0,0.04)]">
                <h2 className="text-[16px] font-medium text-[#0e2841] tracking-[-0.32px] mb-3.5">
                  Portfolio Summary (Balance Sheet)
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[14px]">
                  {renderMetricCard(
                    "Property Value",
                    fmtMoney(portfolioStats.invVal),
                    "Investment Portfolio",
                    "/images/review/90cea.svg",
                    () => setSelectedMetric("Property Value"),
                    selectedMetric === "Property Value"
                  )}
                  {renderMetricCard(
                    "Total Loans",
                    fmtMoney(portfolioStats.invLoans),
                    "Investment Debt",
                    "/images/review/89393.svg",
                    () => setSelectedMetric("Total Loans"),
                    selectedMetric === "Total Loans"
                  )}
                  {renderMetricCard(
                    "Total Equity",
                    fmtMoney(portfolioStats.invEquity),
                    "Net Investment Equity",
                    "/images/review/38829.svg",
                    () => setSelectedMetric("Total Equity"),
                    selectedMetric === "Total Equity"
                  )}
                  {renderMetricCard(
                    "LVR",
                    `${portfolioStats.invLvr.toFixed(2)}%`,
                    "Loan-to-Value Ratio",
                    "/images/review/30184.svg",
                    () => setSelectedMetric("LVR (Loan-to-Value Ratio)"),
                    selectedMetric.includes("LVR")
                  )}
                </div>
              </div>

              {/* Bottom 2-Column Grid (1044:10618) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-[24px]">
                {renderNetYieldChart("Net Yield History & Trend")}

                {/* Right: property contribution - Gross Field (1044:10674) */}
                <div className="bg-white rounded-[12px] p-[20px] shadow-[0px_11px_18px_0px_rgba(0,0,0,0.04)] min-h-[267px]">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-[10px]">
                      <div className="bg-white drop-shadow-[0px_4px_2px_rgba(0,0,0,0.05)] flex items-start p-[5px] rounded-full">
                        <img
                          src="/images/review/ce848.svg"
                          alt=""
                          className="w-[16px] h-[15.5px]"
                        />
                      </div>
                      <h3 className="text-[14px] font-semibold text-[#0e2841] tracking-[-0.28px]">
                        property contribution - Gross Field
                      </h3>
                    </div>
                    <span className="text-[13px] font-medium text-[#6b6b6b]">
                      Highest first
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="grid grid-cols-12 items-center text-[13px] text-[#8C9BA8] font-medium pb-2.5 border-b border-[#F0F1F3] px-2">
                      <div className="col-span-2 flex items-center gap-1">
                        <span>#</span>
                        <ChevronDown className="w-3 h-3" />
                      </div>
                      <div className="col-span-7 flex items-center gap-1">
                        <span>Property</span>
                        <ChevronDown className="w-3 h-3" />
                      </div>
                      <div className="col-span-3 flex items-center justify-end gap-1">
                        <span>Return</span>
                        <ChevronDown className="w-3 h-3" />
                      </div>
                    </div>

                    {portfolioStats.invProps.map((item, idx) => (
                      <div
                        key={item.id}
                        className="grid grid-cols-12 items-center py-3 px-2 border-b border-[#F6F7F9] last:border-b-0 text-[13.5px]"
                      >
                        <div className="col-span-2">
                          <span className="w-[24px] h-[24px] rounded-[4px] bg-[#f6f9fb] inline-flex items-center justify-center text-[12px] font-medium text-[#1a1c1e]">
                            {idx + 1}
                          </span>
                        </div>
                        <div className="col-span-7 text-[#1a1c1e] font-medium">
                          {item.address}
                        </div>
                        <div className="col-span-3 text-right font-semibold text-[#22C55E]">
                          {item.totalReturn}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Insights & Recommendations Carousel for Portfolio Summary */}
              {renderInsightsCarousel(selectedMetric, "Portfolio-Wide")}
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUB-TAB 2: Property (Portfolio Property Valuation & Performance)          */}
          {/* ========================================================================= */}
          {portfolioSubTab === "Property" && (
            <div className="space-y-6">
              <div className="bg-white rounded-[12px] p-[20px] shadow-[0px_11px_18px_0px_rgba(0,0,0,0.04)] space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-[16px] font-semibold text-[#0e2841] tracking-[-0.32px]">
                      Portfolio Property Performance &amp; Valuation
                    </h2>
                    <p className="text-[12px] text-[#6b6b6b] mt-0.5">
                      Aggregated property metrics, rental yields, and capital performance across all holdings
                    </p>
                  </div>
                  <span className="text-[12.5px] font-medium text-[#0e2841] bg-[#f6f9fb] px-3 py-1 rounded-full border border-[#e2e8f0]">
                    {portfolioStats.validProps.length} Properties in Portfolio
                  </span>
                </div>

                {/* Row 1: 4 Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[14px]">
                  {renderMetricCard(
                    "Gross Rental Yield",
                    `${portfolioStats.portfolioGrossYield.toFixed(2)}%`,
                    "Combined Investment Yield",
                    "/images/review/90cea.svg"
                  )}
                  {renderMetricCard(
                    "Total Weekly Rent",
                    `${fmtMoney(portfolioStats.totalWeeklyRent)}/wk`,
                    `${fmtMoney(portfolioStats.totalAnnualRent)} Annual Gross`,
                    "/images/review/89393.svg"
                  )}
                  {renderMetricCard(
                    "Average Property Value",
                    fmtMoney(portfolioStats.avgValuation),
                    `Across ${portfolioStats.validProps.length} Properties`,
                    "/images/review/38829.svg"
                  )}
                  {renderMetricCard(
                    "Capital Growth (CAGR)",
                    "5.20%",
                    "5-Yr Annualised Appreciation",
                    "/images/review/61b85.svg"
                  )}
                </div>

                {/* Row 2: 3 Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-[14px] pt-1">
                  {renderMetricCard(
                    "Portfolio Vacancy Rate",
                    "1.8%",
                    "Metro rental benchmark: 2.1%",
                    "/images/review/90cea.svg"
                  )}
                  {renderMetricCard(
                    "Total Portfolio Properties",
                    `${portfolioStats.validProps.length}`,
                    `${portfolioStats.invProps.length} Investment · ${portfolioStats.ooProps.length} Owner-Occupied`,
                    "/images/review/89393.svg"
                  )}
                  {renderMetricCard(
                    "Capital Appreciation",
                    fmtMoney(
                      Math.max(
                        0,
                        portfolioStats.totalVal - portfolioStats.totalPurchasePrice
                      )
                    ),
                    `From ${fmtMoney(portfolioStats.totalPurchasePrice)} purchase cost`,
                    "/images/review/30184.svg"
                  )}
                </div>
              </div>

              {/* Bottom 2-Column Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-[24px]">
                {renderNetYieldChart("Property Valuation Growth & Trend")}

                {/* Right: Property Assets & Yield Contribution */}
                <div className="bg-white rounded-[12px] p-[20px] shadow-[0px_11px_18px_0px_rgba(0,0,0,0.04)] min-h-[267px]">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-[10px]">
                      <div className="bg-white drop-shadow-[0px_4px_2px_rgba(0,0,0,0.05)] flex items-start p-[5px] rounded-full">
                        <img
                          src="/images/review/ce848.svg"
                          alt=""
                          className="w-[16px] h-[15.5px]"
                        />
                      </div>
                      <h3 className="text-[14px] font-semibold text-[#0e2841] tracking-[-0.28px]">
                        Property Assets &amp; Yield Contribution
                      </h3>
                    </div>
                    <span className="text-[13px] font-medium text-[#6b6b6b]">
                      All Properties
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[13px]">
                      <thead>
                        <tr className="border-b border-[#F0F1F3] text-[#8C9BA8] font-medium">
                          <th className="pb-2.5 px-2">#</th>
                          <th className="pb-2.5 px-2">Property Address</th>
                          <th className="pb-2.5 px-2">Type</th>
                          <th className="pb-2.5 px-2 text-right">Valuation</th>
                          <th className="pb-2.5 px-2 text-right">Rent</th>
                          <th className="pb-2.5 px-2 text-right">Gross Yield</th>
                          <th className="pb-2.5 px-2 text-right">Share</th>
                        </tr>
                      </thead>
                      <tbody>
                        {portfolioStats.validProps.map((p, idx) => {
                          const sharePct =
                            portfolioStats.totalVal > 0
                              ? (p.rawValue / portfolioStats.totalVal) * 100
                              : 0;
                          return (
                            <tr
                              key={p.id}
                              className="border-b border-[#F6F7F9] last:border-b-0 hover:bg-[#FAFAFB]"
                            >
                              <td className="py-3 px-2 font-medium text-[#1a1c1e]">
                                {idx + 1}
                              </td>
                              <td
                                className="py-3 px-2 font-medium text-[#1a1c1e] max-w-[170px] truncate"
                                title={p.address}
                              >
                                {p.address}
                              </td>
                              <td className="py-3 px-2 text-[#6B7280]">
                                {p.isOwnerOccupied ? "Owner Occupied" : "Investment"}
                              </td>
                              <td className="py-3 px-2 text-right font-medium text-[#1a1c1e]">
                                {fmtMoney(p.rawValue)}
                              </td>
                              <td className="py-3 px-2 text-right text-[#1a1c1e]">
                                {p.isOwnerOccupied
                                  ? "----"
                                  : `${fmtMoney(p.rawWkRent)}/wk`}
                              </td>
                              <td className="py-3 px-2 text-right font-semibold text-[#18794E]">
                                {p.isOwnerOccupied
                                  ? "----"
                                  : `${(p.yieldPct || 0).toFixed(2)}%`}
                              </td>
                              <td className="py-3 px-2 text-right font-medium text-[#0e2841]">
                                {sharePct.toFixed(1)}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Bottom Insights Carousel for Portfolio Property Performance */}
              {renderInsightsCarousel(selectedMetric, "Portfolio-Wide")}
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUB-TAB 3: Equity (Portfolio Equity Position & Debt Structure)            */}
          {/* ========================================================================= */}
          {portfolioSubTab === "Equity" && (
            <div className="space-y-6">
              <div className="bg-white rounded-[12px] p-[20px] shadow-[0px_11px_18px_0px_rgba(0,0,0,0.04)] space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-[16px] font-semibold text-[#0e2841] tracking-[-0.32px]">
                      Portfolio Equity Position &amp; Debt Structure
                    </h2>
                    <p className="text-[12px] text-[#6b6b6b] mt-0.5">
                      Net asset equity, loan facilities, leverage distribution, and borrowable equity reserves
                    </p>
                  </div>
                  <span className="text-[12.5px] font-medium text-[#18794E] bg-[#18794E]/10 px-3 py-1 rounded-full border border-[#18794E]/20">
                    LVR: {portfolioStats.invLvr.toFixed(2)}% (Target: &lt; 80%)
                  </span>
                </div>

                {/* Row 1: 4 Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[14px]">
                  {renderMetricCard(
                    "Total Net Equity",
                    fmtMoney(portfolioStats.invEquity),
                    `Total Debt: ${fmtMoney(portfolioStats.invLoans)}`,
                    "/images/review/38829.svg"
                  )}
                  {renderMetricCard(
                    "Portfolio LVR",
                    `${portfolioStats.invLvr.toFixed(2)}%`,
                    "Loan-to-Value Ratio",
                    "/images/review/30184.svg"
                  )}
                  {renderMetricCard(
                    "Usable Equity (80% LVR)",
                    fmtMoney(portfolioStats.usableEquity80),
                    "Borrowable Acquisition Buffer",
                    "/images/review/90cea.svg"
                  )}
                  {renderMetricCard(
                    "Pre-Tax ROE",
                    "7.45%",
                    "Return on Invested Equity",
                    "/images/review/61b85.svg"
                  )}
                </div>

                {/* Row 2: 3 Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-[14px] pt-1">
                  {renderMetricCard(
                    "Total Mortgage Debt",
                    fmtMoney(portfolioStats.invLoans),
                    `${portfolioStats.totalLoansCount} Active Facilities`,
                    "/images/review/89393.svg"
                  )}
                  {renderMetricCard(
                    "Superannuation & Reserves",
                    fmtMoney(portfolioStats.superBal),
                    "Household Super Liquidity",
                    "/images/review/90cea.svg"
                  )}
                  {renderMetricCard(
                    "Net Equity Ratio",
                    `${(100 - portfolioStats.invLvr).toFixed(1)}%`,
                    "Unencumbered Asset Coverage",
                    "/images/review/30184.svg"
                  )}
                </div>
              </div>

              {/* Bottom 2-Column Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-[24px]">
                {renderNetYieldChart("Debt Amortization & Equity Build-Up")}

                {/* Right: Equity & Debt Breakdown Table */}
                <div className="bg-white rounded-[12px] p-[20px] shadow-[0px_11px_18px_0px_rgba(0,0,0,0.04)] min-h-[267px]">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-[10px]">
                      <div className="bg-white drop-shadow-[0px_4px_2px_rgba(0,0,0,0.05)] flex items-start p-[5px] rounded-full">
                        <img
                          src="/images/review/ce848.svg"
                          alt=""
                          className="w-[16px] h-[15.5px]"
                        />
                      </div>
                      <h3 className="text-[14px] font-semibold text-[#0e2841] tracking-[-0.28px]">
                        Equity &amp; Debt Breakdown by Property
                      </h3>
                    </div>
                    <span className="text-[13px] font-medium text-[#6b6b6b]">
                      Debt vs Equity
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[13px]">
                      <thead>
                        <tr className="border-b border-[#F0F1F3] text-[#8C9BA8] font-medium">
                          <th className="pb-2.5 px-2">#</th>
                          <th className="pb-2.5 px-2">Property</th>
                          <th className="pb-2.5 px-2 text-right">Valuation</th>
                          <th className="pb-2.5 px-2 text-right">Loan Balance</th>
                          <th className="pb-2.5 px-2 text-right">Net Equity</th>
                          <th className="pb-2.5 px-2 text-right">LVR</th>
                          <th className="pb-2.5 px-2 text-right">Usable (80%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {portfolioStats.validProps.map((p, idx) => {
                          const pUsable = Math.max(0, p.rawValue * 0.8 - p.rawLoans);
                          const pLvr =
                            p.rawValue > 0 ? (p.rawLoans / p.rawValue) * 100 : 0;
                          return (
                            <tr
                              key={p.id}
                              className="border-b border-[#F6F7F9] last:border-b-0 hover:bg-[#FAFAFB]"
                            >
                              <td className="py-3 px-2 font-medium text-[#1a1c1e]">
                                {idx + 1}
                              </td>
                              <td
                                className="py-3 px-2 font-medium text-[#1a1c1e] max-w-[170px] truncate"
                                title={p.address}
                              >
                                {p.address}
                              </td>
                              <td className="py-3 px-2 text-right text-[#1a1c1e]">
                                {fmtMoney(p.rawValue)}
                              </td>
                              <td className="py-3 px-2 text-right text-[#E11D48] font-medium">
                                {fmtMoney(p.rawLoans)}
                              </td>
                              <td className="py-3 px-2 text-right text-[#0e2841] font-semibold">
                                {fmtMoney(p.rawEquity)}
                              </td>
                              <td className="py-3 px-2 text-right font-medium text-[#1a1c1e]">
                                {pLvr.toFixed(1)}%
                              </td>
                              <td className="py-3 px-2 text-right font-semibold text-[#18794E]">
                                {fmtMoney(pUsable)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Bottom Insights Carousel for Portfolio Equity */}
              {renderInsightsCarousel(selectedMetric, "Portfolio-Wide")}
            </div>
          )}

          {/* ========================================================================= */}
          {/* SUB-TAB 4: Cash (Portfolio Cash Flow & Operating Efficiency)               */}
          {/* ========================================================================= */}
          {portfolioSubTab === "Cash" && (
            <div className="space-y-6">
              <div className="bg-white rounded-[12px] p-[20px] shadow-[0px_11px_18px_0px_rgba(0,0,0,0.04)] space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-[16px] font-semibold text-[#0e2841] tracking-[-0.32px]">
                      Portfolio Cash Flow &amp; Operating Efficiency
                    </h2>
                    <p className="text-[12px] text-[#6b6b6b] mt-0.5">
                      Gross rental revenue, outgoings, debt servicing, and net holding position
                    </p>
                  </div>
                  <span
                    className={`text-[12.5px] font-medium px-3 py-1 rounded-full border ${
                      portfolioStats.preTaxCashFlow >= 0
                        ? "text-[#18794E] bg-[#18794E]/10 border-[#18794E]/20"
                        : "text-[#C66900] bg-[#C66900]/10 border-[#C66900]/20"
                    }`}
                  >
                    Pre-Tax Cash: {portfolioStats.preTaxCashFlow >= 0 ? "+" : ""}
                    {fmtMoney(portfolioStats.preTaxCashFlow)}/yr
                  </span>
                </div>

                {/* Row 1: 4 Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[14px]">
                  {renderMetricCard(
                    "Annual Gross Rent",
                    fmtMoney(portfolioStats.totalAnnualRent),
                    `${fmtMoney(portfolioStats.totalWeeklyRent)} / week`,
                    "/images/review/90cea.svg"
                  )}
                  {renderMetricCard(
                    "Operating Expenses",
                    fmtMoney(portfolioStats.totalAnnualExpenses),
                    `${(
                      (portfolioStats.totalAnnualExpenses /
                        Math.max(1, portfolioStats.totalAnnualRent)) *
                      100
                    ).toFixed(1)}% Expense Ratio`,
                    "/images/review/89393.svg"
                  )}
                  {renderMetricCard(
                    "Net Operating Income",
                    fmtMoney(
                      Math.max(
                        0,
                        portfolioStats.totalAnnualRent -
                          portfolioStats.totalAnnualExpenses
                      )
                    ),
                    "Pre-Debt Net Revenue",
                    "/images/review/38829.svg"
                  )}
                  {renderMetricCard(
                    "Net Rental Yield",
                    `${portfolioStats.portfolioNetYield.toFixed(2)}%`,
                    "Yield After Outgoings",
                    "/images/review/61b85.svg"
                  )}
                </div>

                {/* Row 2: 3 Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-[14px] pt-1">
                  {renderMetricCard(
                    "Annual Debt Service",
                    fmtMoney(portfolioStats.totalDebtService),
                    "Est. Mortgage Interest & Fees",
                    "/images/review/90cea.svg"
                  )}
                  {renderMetricCard(
                    "Net Pre-Tax Cash Flow",
                    `${portfolioStats.preTaxCashFlow >= 0 ? "+" : ""}${fmtMoney(
                      portfolioStats.preTaxCashFlow
                    )}`,
                    `${fmtMoney(
                      Math.round(portfolioStats.preTaxCashFlow / 52)
                    )}/wk Net Holding Position`,
                    "/images/review/89393.svg"
                  )}
                  {renderMetricCard(
                    "Cash Cover Buffer",
                    "150 wks",
                    "Reserve Liquidity Cover",
                    "/images/review/30184.svg"
                  )}
                </div>
              </div>

              {/* Bottom 2-Column Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-[24px]">
                {renderNetYieldChart("Portfolio Cash Flow & Revenue Trend")}

                {/* Right: Property Cash Flow Breakdown Table */}
                <div className="bg-white rounded-[12px] p-[20px] shadow-[0px_11px_18px_0px_rgba(0,0,0,0.04)] min-h-[267px]">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-[10px]">
                      <div className="bg-white drop-shadow-[0px_4px_2px_rgba(0,0,0,0.05)] flex items-start p-[5px] rounded-full">
                        <img
                          src="/images/review/ce848.svg"
                          alt=""
                          className="w-[16px] h-[15.5px]"
                        />
                      </div>
                      <h3 className="text-[14px] font-semibold text-[#0e2841] tracking-[-0.28px]">
                        Property Cash Flow Breakdown
                      </h3>
                    </div>
                    <span className="text-[13px] font-medium text-[#6b6b6b]">
                      Annual Cash Flows
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[13px]">
                      <thead>
                        <tr className="border-b border-[#F0F1F3] text-[#8C9BA8] font-medium">
                          <th className="pb-2.5 px-2">#</th>
                          <th className="pb-2.5 px-2">Property</th>
                          <th className="pb-2.5 px-2 text-right">Gross Rent</th>
                          <th className="pb-2.5 px-2 text-right">Expenses</th>
                          <th className="pb-2.5 px-2 text-right">Debt Service</th>
                          <th className="pb-2.5 px-2 text-right">Net Cash Flow</th>
                          <th className="pb-2.5 px-2 text-right">Net Yield</th>
                        </tr>
                      </thead>
                      <tbody>
                        {portfolioStats.validProps.map((p, idx) => {
                          return (
                            <tr
                              key={p.id}
                              className="border-b border-[#F6F7F9] last:border-b-0 hover:bg-[#FAFAFB]"
                            >
                              <td className="py-3 px-2 font-medium text-[#1a1c1e]">
                                {idx + 1}
                              </td>
                              <td
                                className="py-3 px-2 font-medium text-[#1a1c1e] max-w-[170px] truncate"
                                title={p.address}
                              >
                                {p.address}
                              </td>
                              <td className="py-3 px-2 text-right text-[#1a1c1e]">
                                {p.isOwnerOccupied ? "----" : fmtMoney(p.rawGrossRent)}
                              </td>
                              <td className="py-3 px-2 text-right text-[#E11D48]">
                                {p.isOwnerOccupied
                                  ? "----"
                                  : `-${fmtMoney(p.rawExpenses)}`}
                              </td>
                              <td className="py-3 px-2 text-right text-[#6B7280]">
                                {fmtMoney(p.rawDebtService)}
                              </td>
                              <td
                                className={`py-3 px-2 text-right font-semibold ${
                                  (p.rawNetCashFlow || 0) >= 0
                                    ? "text-[#18794E]"
                                    : "text-[#C66900]"
                                }`}
                              >
                                {p.isOwnerOccupied
                                  ? "----"
                                  : `${(p.rawNetCashFlow || 0) >= 0 ? "+" : ""}${fmtMoney(
                                      p.rawNetCashFlow || 0
                                    )}`}
                              </td>
                              <td className="py-3 px-2 text-right font-medium text-[#0e2841]">
                                {p.isOwnerOccupied
                                  ? "----"
                                  : `${(p.rawNetYield || 0).toFixed(2)}%`}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Bottom Insights Carousel for Portfolio Cash */}
              {renderInsightsCarousel(selectedMetric, "Portfolio-Wide")}
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 3: PROPERTY ANALYSIS (Figma 1044:9276 + Cash & Capital Mgmt)  */}
      {/* ================================================================= */}
      {activeTab === "property-analysis" && (
        <div className="space-y-5">
          {/* MAIN PROPERTY ANALYSIS OVERVIEW (Figma 1044:9276 — exact match to 186/media_0.png) */}
          {propertySubView === "overview" && (
            <>
              {/* Second underlined < Back to Reports link (1044:9717) */}
              <button
                type="button"
                onClick={onBack}
                className="flex gap-[4px] items-center cursor-pointer pt-0.5 pb-0.5"
              >
                <img
                  src="/images/review/74f5d.svg"
                  alt=""
                  className="size-[16px]"
                />
                <span className="font-['Inter',sans-serif] font-medium text-[#1a1c1e] text-[13px] leading-[18px] tracking-[-0.084px] underline">
                  {readOnly ? "Back to Reports" : "Back to Review Workspace"}
                </span>
              </button>

              {/* Property Overview Card (1044:9657) - Compact Non-Scrolling Layout */}
              <div className="bg-white rounded-[10px] shadow-[0px_4px_12px_rgba(0,0,0,0.03)] px-4 py-2.5 border border-[#E2E8F0]">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="font-['Poppins',sans-serif] font-bold text-[#0e2841] text-[16px] tracking-[-0.3px] capitalize">
                    Property Overview
                  </p>
                  {/* Subtle Sub-view Navigation Pills */}
                  <div className="flex items-center gap-1 bg-[#F1F5F9] p-0.5 rounded-[6px]">
                    <span className="text-[11.5px] font-semibold text-[#0e2841] bg-white px-2.5 py-0.5 rounded shadow-2xs">
                      Overview
                    </span>
                    <button
                      type="button"
                      onClick={() => setPropertySubView("cash-management")}
                      className="text-[11.5px] font-medium text-[#64748B] hover:text-[#0e2841] px-2 py-0.5 rounded cursor-pointer transition-colors"
                    >
                      Cash Management
                    </button>
                    <button
                      type="button"
                      onClick={() => setPropertySubView("capital-management")}
                      className="text-[11.5px] font-medium text-[#64748B] hover:text-[#0e2841] px-2 py-0.5 rounded cursor-pointer transition-colors"
                    >
                      Capital Management
                    </button>
                  </div>
                </div>

                <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3">
                  {/* Left: Compact Image + Address + Features */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="relative rounded-[4px] shrink-0 size-[58px] overflow-hidden border border-[#E2E8F0]">
                      <img
                        src={currentProperty.image}
                        alt={currentProperty.address}
                        className="absolute inset-0 size-full object-cover"
                      />
                    </div>

                    <div className="flex flex-col gap-[3px]">
                      {/* Address + Light Blue Pill + Square Dropdown Button */}
                      <div className="flex flex-wrap items-center gap-2 relative">
                        <p className="font-['Poppins',sans-serif] font-bold text-[#0e2841] text-[16px] tracking-[-0.3px]">
                          {currentProperty.address}
                        </p>

                        <div className="bg-[rgba(56,125,215,0.06)] border border-[#1255ad] border-solid flex h-[24px] items-center justify-center px-2.5 rounded-[68px]">
                          <span className="font-['Poppins',sans-serif] font-semibold text-[#1255ad] text-[11px] whitespace-nowrap">
                            {currentProperty.badge}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setIsPropertyDropdownOpen(!isPropertyDropdownOpen)
                          }
                          className="bg-white border border-[#ebebeb] flex h-[26px] w-[28px] items-center justify-center rounded-[6px] shadow-2xs cursor-pointer hover:bg-gray-50 transition-colors"
                          title="Switch Property"
                        >
                          <img
                            src="/images/review/5d15e.svg"
                            alt=""
                            className="w-[12px] h-[6px]"
                          />
                        </button>

                        {isPropertyDropdownOpen && (
                          <div className="absolute top-full left-0 mt-1.5 w-[320px] bg-white rounded-[10px] shadow-lg border border-[#E5E7EB] py-1.5 z-30">
                            {propertiesList.map((prop, idx) => (
                              <button
                                key={prop.id}
                                type="button"
                                onClick={() => {
                                  setSelectedPropertyIndex(idx);
                                  setIsPropertyDropdownOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-[13px] flex items-center justify-between hover:bg-[#f6f9fb] transition-colors cursor-pointer ${
                                  idx === selectedPropertyIndex
                                    ? "font-semibold text-[#0e2841] bg-[#f6f9fb]"
                                    : "text-[#1a1c1e]"
                                }`}
                              >
                                <span className="truncate">{prop.address}</span>
                                <span className="text-[11px] text-[#1255ad] ml-2 shrink-0">
                                  {prop.badge}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Investment Property | House */}
                      <p className="font-['Poppins',sans-serif] font-medium text-[#64748B] text-[11px] tracking-[-0.2px]">
                        {currentProperty.subtitle}
                      </p>

                      {/* 4 Feature Columns */}
                      <div className="flex flex-wrap items-center gap-[18px] sm:gap-[24px] mt-0.5">
                        <div className="flex items-center gap-1.5">
                          <img
                            src="/images/review/f4098.svg"
                            alt=""
                            className="size-[15px]"
                          />
                          <span className="font-medium text-[#1a1c1e] text-[11.5px]">
                            {currentProperty.beds} Beds
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <img
                            src="/images/review/70fd5.svg"
                            alt=""
                            className="size-[15px]"
                          />
                          <span className="font-medium text-[#1a1c1e] text-[11.5px]">
                            {currentProperty.baths} Baths
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <img
                            src="/images/review/08785.svg"
                            alt=""
                            className="size-[15px]"
                          />
                          <span className="font-medium text-[#1a1c1e] text-[11.5px]">
                            {currentProperty.area}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <img
                            src="/images/review/a544d.svg"
                            alt=""
                            className="size-[15px]"
                          />
                          <span className="font-medium text-[#1a1c1e] text-[11.5px]">
                            {currentProperty.garages} Garages
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Purchase Details & Ownership */}
                  <div className="flex items-center justify-end gap-[24px] sm:gap-[36px] text-right">
                    <div className="font-medium leading-[16px] text-[#1a1c1e] text-[12px] whitespace-nowrap">
                      <p className="text-[#8C9BA8] text-[11px]">Purchase Details:</p>
                      <p>Price: {currentProperty.purchasePrice}</p>
                      <p className="text-[#8C9BA8]">{currentProperty.purchaseDate}</p>
                    </div>

                    <div className="h-[36px] w-[1px] bg-[#E2E8F0] shrink-0" />

                    <div className="font-medium leading-[16px] text-[#1a1c1e] text-[12px] whitespace-nowrap">
                      <p className="text-[#8C9BA8] text-[11px]">Ownership:</p>
                      {currentProperty.owners.map((line) => (
                        <p key={line}>{line}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Portfolio Summary (Balance Sheet) — 5 Clickable Metric Cards directly on page */}
              <div className="pt-0.5">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="font-['Poppins',sans-serif] font-semibold text-[#0e2841] text-[14px] tracking-[-0.2px]">
                    Portfolio Summary (Balance Sheet)
                  </p>
                  <span className="text-[11.5px] text-[#8C9BA8]">
                    Click a card to filter charts &amp; recommendations
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {renderMetricCard(
                    "Property Value",
                    currentProperty.propertyValue,
                    "12.4% vs FY2025",
                    "/images/review/90cea.svg",
                    () => handleSelectMetric("Property Value"),
                    selectedMetric === "Property Value"
                  )}
                  {renderMetricCard(
                    "Total Loans",
                    currentProperty.totalLoans,
                    "12.4% vs FY2025",
                    "/images/review/89393.svg",
                    () => handleSelectMetric("Total Loans"),
                    selectedMetric === "Total Loans"
                  )}
                  {renderMetricCard(
                    "Total Equity",
                    currentProperty.totalEquity,
                    "12.4% vs FY2025",
                    "/images/review/38829.svg",
                    () => handleSelectMetric("Total Equity"),
                    selectedMetric === "Total Equity"
                  )}
                  {renderMetricCard(
                    "Total Property Return",
                    currentProperty.totalReturn,
                    "12.4% vs FY2025",
                    "/images/review/61b85.svg",
                    () => handleSelectMetric("Total Property Return"),
                    selectedMetric === "Total Property Return"
                  )}
                  {renderMetricCard(
                    "LVR (Loan-to-Value Ratio)",
                    currentProperty.lvr,
                    "12.4% vs FY2025",
                    "/images/review/30184.svg",
                    () => handleSelectMetric("LVR (Loan-to-Value Ratio)"),
                    selectedMetric === "LVR (Loan-to-Value Ratio)"
                  )}
                </div>
              </div>

              {/* 2 Charts — Interactive and Metric-reactive */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 pt-0.5">
                {renderNetYieldChart()}
                {renderBenchmarkBarChart()}
              </div>

              {/* Bottom Insights & Recommendations Carousel — Metric Reactive & Scrollable */}
              {renderInsightsCarousel(selectedMetric, currentProperty?.address)}
            </>
          )}

          {/* SUB-VIEW 3A: CASH MANAGEMENT (Figma 577:17037 & 768:5817) */}
          {propertySubView === "cash-management" && (
            <div className="space-y-6">
              {renderCompactPropertyBar()}

              {/* Main Card (1044:7614 / 1044:8314) */}
              <div className="bg-white rounded-[12px] p-[20px] shadow-[0px_11px_18px_0px_rgba(0,0,0,0.04)] space-y-5">
                <div>
                  <div className="bg-[#f2f1f2] rounded-[8px] p-[8px] inline-flex items-center gap-[6px]">
                    <button
                      type="button"
                      onClick={() => setCashSubTab("cash-performance")}
                      className={`h-[37px] px-[24px] text-[14px] transition-all cursor-pointer ${
                        cashSubTab === "cash-performance"
                          ? "bg-white rounded-[4px] font-semibold text-[#1a1c1e] shadow-2xs"
                          : "bg-transparent rounded-[6px] font-medium text-[#a0a0a0] hover:text-[#1a1c1e]"
                      }`}
                    >
                      Cash Performance
                    </button>
                    <button
                      type="button"
                      onClick={() => setCashSubTab("operational-efficiency")}
                      className={`h-[37px] px-[24px] text-[14px] transition-all cursor-pointer ${
                        cashSubTab === "operational-efficiency"
                          ? "bg-white rounded-[4px] font-semibold text-[#1a1c1e] shadow-2xs"
                          : "bg-transparent rounded-[6px] font-medium text-[#a0a0a0] hover:text-[#1a1c1e]"
                      }`}
                    >
                      Operational Efficiency
                    </button>
                  </div>
                  <p className="text-[12px] text-[#6b6b6b] mt-2">
                    Select a category to view its dedicated performance
                    indicators
                  </p>
                </div>

                {cashSubTab === "cash-performance" ? (
                  <div>
                    <h3 className="text-[16px] font-semibold text-[#0e2841] mb-3.5">
                      1. Cash Performance Metrics
                    </h3>
                    {/* Row 1: 4 Cards (1044:7633) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[12px]">
                      {renderMetricCard(
                        "Gross Yield",
                        "4.61%",
                        "12.4% vs FY2025",
                        "/images/review/90cea.svg"
                      )}
                      {renderMetricCard(
                        "Yield",
                        "3.1%",
                        "12.4% vs FY2025",
                        "/images/review/38829.svg"
                      )}
                      {renderMetricCard(
                        "Weekly Rent",
                        "$780/wk",
                        "12.4% vs FY2025",
                        "/images/review/89393.svg"
                      )}
                      {renderMetricCard(
                        "Vacancy Rate",
                        "1.8%",
                        "Metro rental vacancy",
                        "/images/review/61b85.svg"
                      )}
                    </div>
                    {/* Row 2: 3 Cards (1044:7754) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-[12px] mt-[14px]">
                      {renderMetricCard(
                        "Before tax cash flow",
                        "-$4143",
                        "12.4% vs FY2025",
                        "/images/review/90cea.svg"
                      )}
                      {renderMetricCard(
                        "After tax cash flow",
                        "-$638",
                        "12.4% vs FY2025",
                        "/images/review/89393.svg"
                      )}
                      {renderMetricCard(
                        "cash cover buffer",
                        "150wks",
                        "12.4% vs FY2025",
                        "/images/review/30184.svg"
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-[16px] font-semibold text-[#0e2841] mb-3.5">
                      2. Operational Expense Efficiency
                    </h3>
                    {/* Row 1: 3 Cards (1044:8333) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-[14px]">
                      {renderMetricCard(
                        "property Management",
                        "$3,245",
                        "12.4% vs FY2025",
                        "/images/review/90cea.svg"
                      )}
                      {renderMetricCard(
                        "Utilities (Water)",
                        "$1,320",
                        "12.4% vs FY2025",
                        "/images/review/89393.svg"
                      )}
                      {renderMetricCard(
                        "Govt Charges",
                        "$2,450",
                        "12.4% vs FY2025",
                        "/images/review/38829.svg"
                      )}
                    </div>
                    {/* Row 2: 3 Cards (1044:8432) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-[14px] mt-[14px]">
                      {renderMetricCard(
                        "Repairs & Maint",
                        "$1,650",
                        "12.4% vs FY2025",
                        "/images/review/61b85.svg"
                      )}
                      {renderMetricCard(
                        "Insurance",
                        "$1,850",
                        "12.4% vs FY2025",
                        "/images/review/89393.svg"
                      )}
                      {renderMetricCard(
                        "Other / Strata",
                        "$4,200",
                        "12.4% vs FY2025",
                        "/images/review/30184.svg"
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 2 Charts (768:5704) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-[24px]">
                {renderNetYieldChart("Debt Amortization & Equity Build-Up")}
                {renderBenchmarkBarChart("Operational Benchmarks")}
              </div>

              {/* Bottom Bar: Back on Left, + Add Insight on Right (768:5803) */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setPropertySubView("overview")}
                  className="bg-[#0e2841] hover:bg-[#163859] text-white h-[40px] w-[86px] rounded-[8px] text-[14px] font-medium flex items-center justify-center transition-colors cursor-pointer"
                >
                  Back
                </button>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() =>
                      openAddInsightModal(
                        currentProperty?.address,
                        cashSubTab === "operational-efficiency"
                          ? "Operating Expenses"
                          : "Rental Income"
                      )
                    }
                    className="bg-[#0e2841] hover:bg-[#163859] text-white h-[40px] w-[177px] rounded-[8px] text-[14px] font-medium flex items-center justify-center transition-colors cursor-pointer"
                  >
                    + Add Insight
                  </button>
                )}
              </div>

              {/* Bottom Insights Carousel for Cash Management */}
              {renderInsightsCarousel(selectedMetric, currentProperty?.address)}
            </div>
          )}

          {/* SUB-VIEW 3B: CAPITAL MANAGEMENT (Figma 579:17880 & 768:3752) */}
          {propertySubView === "capital-management" && (
            <div className="space-y-6">
              {renderCompactPropertyBar()}

              {/* Main Card (768:3557 / 768:4107) */}
              <div className="bg-white rounded-[12px] p-[20px] shadow-[0px_11px_18px_0px_rgba(0,0,0,0.04)] space-y-5">
                <div>
                  <div className="bg-[#f2f1f2] rounded-[8px] p-[8px] inline-flex items-center gap-[6px]">
                    <button
                      type="button"
                      onClick={() => setCapitalSubTab("asset-performance")}
                      className={`h-[37px] px-[24px] text-[14px] transition-all cursor-pointer ${
                        capitalSubTab === "asset-performance"
                          ? "bg-white rounded-[4px] font-semibold text-[#1a1c1e] shadow-2xs"
                          : "bg-transparent rounded-[6px] font-medium text-[#a0a0a0] hover:text-[#1a1c1e]"
                      }`}
                    >
                      Asset Performance
                    </button>
                    <button
                      type="button"
                      onClick={() => setCapitalSubTab("debt-management")}
                      className={`h-[37px] px-[24px] text-[14px] transition-all cursor-pointer ${
                        capitalSubTab === "debt-management"
                          ? "bg-white rounded-[4px] font-semibold text-[#1a1c1e] shadow-2xs"
                          : "bg-transparent rounded-[6px] font-medium text-[#a0a0a0] hover:text-[#1a1c1e]"
                      }`}
                    >
                      Debt Management
                    </button>
                  </div>
                  <p className="text-[12px] text-[#6b6b6b] mt-2">
                    Select a category to view its dedicated performance
                    indicators (as per Cash Management pattern)
                  </p>
                </div>

                {capitalSubTab === "asset-performance" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[14px]">
                    {renderMetricCard(
                      "CAGR (Growth Rate)",
                      "3.8%",
                      "12.4% vs FY2025",
                      "/images/review/90cea.svg"
                    )}
                    {renderMetricCard(
                      "Pre-Tax Cash ROE",
                      "-1.2%",
                      "12.4% vs FY2025",
                      "/images/review/89393.svg"
                    )}
                    {renderMetricCard(
                      "After Tax Cash ROE",
                      "-0.2%",
                      "12.4% vs FY2025",
                      "/images/review/38829.svg"
                    )}
                    {renderMetricCard(
                      "Total ROE",
                      "7.7%",
                      "12.4% vs FY2025",
                      "/images/review/61b85.svg"
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Loan 1 | Loan 2 | Loan 3 selector (1009:3760) */}
                    <div className="bg-[#f2f1f2] rounded-[8px] p-[6.5px] inline-flex items-center gap-[6px]">
                      {(["Loan 1", "Loan 2", "Loan 3"] as const).map((loan) => (
                        <button
                          key={loan}
                          type="button"
                          onClick={() => setSelectedLoanTab(loan)}
                          className={`h-[37px] px-[20px] text-[13.5px] transition-all cursor-pointer ${
                            selectedLoanTab === loan
                              ? "bg-white rounded-[4px] font-semibold text-[#1a1c1e] shadow-2xs"
                              : "bg-transparent rounded-[6px] font-medium text-[#a0a0a0] hover:text-[#1a1c1e]"
                          }`}
                        >
                          {loan}
                        </button>
                      ))}
                    </div>

                    {/* Loan 1 Details + Primary Security pill (1009:3780) */}
                    <div className="flex items-center gap-3 pt-1">
                      <h3 className="text-[16px] font-semibold text-[#0e2841]">
                        {selectedLoanTab} Details
                      </h3>
                      <span className="bg-[rgba(56,125,215,0.06)] border border-[#1255ad] text-[#1255ad] text-[11.5px] font-semibold px-3 py-0.5 rounded-full">
                        Primary Security
                      </span>
                    </div>

                    {/* Row 1: 3 Cards (768:4335) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-[14px]">
                      {renderMetricCard(
                        "Loan Balance",
                        "$485,000",
                        "12.4% vs FY2025",
                        "/images/review/89393.svg"
                      )}
                      {renderMetricCard(
                        "Rate Type",
                        "Interest Only",
                        "12.4% vs FY2025",
                        "/images/review/38829.svg"
                      )}
                      {renderMetricCard(
                        "IO Expiry",
                        "28 Nov 2027",
                        "12.4% vs FY2025",
                        "/images/review/30184.svg"
                      )}
                    </div>

                    {/* Row 2: 3 Cards (768:4428) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-[14px]">
                      {renderMetricCard(
                        "Current Rate",
                        "6.24%",
                        "Market Rate 6:40%",
                        "/images/review/61b85.svg"
                      )}
                      {renderMetricCard(
                        "Monthly Repayment",
                        "28 Nov 2027",
                        "12.4% vs FY2025",
                        "/images/review/89393.svg"
                      )}
                      {renderMetricCard(
                        "Loan expiry",
                        "$4,200",
                        "12.4% vs FY2025",
                        "/images/review/90cea.svg"
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 2 Charts (768:4577) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-[24px]">
                {renderNetYieldChart("Debt Amortization & Equity Build-Up")}
                {renderBenchmarkBarChart("Capital Advisory Benchmarks")}
              </div>

              {/* Bottom Bar: Back on Left, + Add Insight on Right (768:4676) */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setPropertySubView("overview")}
                  className="bg-[#0e2841] hover:bg-[#163859] text-white h-[40px] w-[86px] rounded-[8px] text-[14px] font-medium flex items-center justify-center transition-colors cursor-pointer"
                >
                  Back
                </button>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() =>
                      openAddInsightModal(
                        currentProperty?.address,
                        capitalSubTab === "debt-management"
                          ? "Debt & Refinancing"
                          : "Capital Growth"
                      )
                    }
                    className="bg-[#0e2841] hover:bg-[#163859] text-white h-[40px] w-[177px] rounded-[8px] text-[14px] font-medium flex items-center justify-center transition-colors cursor-pointer"
                  >
                    + Add Insight
                  </button>
                )}
              </div>

              {/* Bottom Insights Carousel for Capital Management */}
              {renderInsightsCarousel(selectedMetric, currentProperty?.address)}
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 4: INTERACTIVE FUTURE OUTLOOK                                 */}
      {/* ================================================================= */}
      {activeTab === "future-outlook" && (
        <div className="space-y-6 pt-2 font-[Inter,sans-serif]">
          {/* Top Subheader: Title on Left, 4 Scenario Controls on Right */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-[42px] h-[42px] rounded-[10px] bg-[#E0F2FE] flex items-center justify-center text-[#0284C7] shrink-0">
                <BarChart3 className="w-5 h-5 text-[#0284C7]" />
              </div>
              <div>
                <h2 className="font-['Poppins',sans-serif] text-[20px] font-bold text-[#0E2841] leading-tight">
                  Future Outlook
                </h2>
                <p className="text-[12.5px] text-[#64748B] mt-0.5">
                  Model your household&apos;s financial future with different scenarios.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Card 1: Scenario a - current plan */}
              <button
                type="button"
                onClick={() => setActiveScenario("a")}
                className={`px-4 py-2 rounded-[10px] text-left transition-all cursor-pointer ${
                  activeScenario === "a"
                    ? "bg-[#0E2841] text-white shadow-sm ring-2 ring-[#0E2841]"
                    : "bg-white border border-[#E2E8F0] text-[#0E2841] hover:border-[#0E2841]"
                }`}
              >
                <span
                  className={`block text-[10.5px] uppercase tracking-wider font-semibold ${
                    activeScenario === "a" ? "text-white/80" : "text-[#64748B]"
                  }`}
                >
                  Scenario a – current plan
                </span>
                <span className="block text-[15px] font-extrabold mt-0.5">
                  {fmtMoney(dataA.projectIncomeTotal)} p.a.
                </span>
              </button>

              {/* Card 2: Scenario b - what if */}
              <button
                type="button"
                onClick={() => setActiveScenario("b")}
                className={`px-4 py-2 rounded-[10px] text-left transition-all cursor-pointer ${
                  activeScenario === "b"
                    ? "bg-[#0E2841] text-white shadow-sm ring-2 ring-[#0E2841]"
                    : "bg-white border border-[#E2E8F0] text-[#0E2841] hover:border-[#0E2841]"
                }`}
              >
                <span
                  className={`block text-[10.5px] uppercase tracking-wider font-semibold ${
                    activeScenario === "b" ? "text-white/80" : "text-[#64748B]"
                  }`}
                >
                  Scenario b – what if
                </span>
                <span className="block text-[15px] font-extrabold mt-0.5">
                  {fmtMoney(dataB.projectIncomeTotal)} p.a.
                </span>
              </button>

              {/* Card 3: What if surplus */}
              <div className="px-4 py-2 rounded-[10px] bg-[#ECFDF5] border border-[#A7F3D0] text-left">
                <span className="block text-[10.5px] font-semibold text-[#059669]">
                  What if surplus
                </span>
                <span className="block text-[15px] font-extrabold text-[#059669] mt-0.5">
                  +{fmtMoney(surplus)} p.a.
                </span>
              </div>

              {/* Button 4: Copy Plan to What If */}
              <button
                type="button"
                onClick={handleCopyPlanToWhatIf}
                className="px-3.5 py-2.5 bg-white border border-[#CBD5E1] rounded-[8px] flex items-center gap-1.5 text-[12px] font-semibold text-[#0E2841] hover:bg-gray-50 transition-colors shadow-2xs cursor-pointer"
                title="Copy current Scenario A levers into Scenario B"
              >
                <Copy className="w-3.5 h-3.5 text-[#0E2841]" />
                <span>{copiedToWhatIf ? "Copied!" : "Copy Plan to What If"}</span>
              </button>
            </div>
          </div>

          {/* Performance vs Assumptions Banner */}
          <div className="bg-white border border-[#E2E8F0] rounded-[14px] p-4 shadow-2xs">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              {/* Col 1 */}
              <div>
                <h3 className="font-['Poppins',sans-serif] text-[14px] font-bold text-[#0E2841] leading-tight">
                  Current Client Portfolio
                </h3>
                <p className="text-[12px] text-[#64748B] mt-0.5">
                  Performance (vs Assumptions)
                </p>
              </div>

              {/* Col 2: Home Value Growth */}
              <div className="flex items-center gap-3">
                <div className="w-[36px] h-[36px] rounded-[8px] bg-[#F0F6FA] flex items-center justify-center text-[#0E2841] shrink-0">
                  <Home className="w-4 h-4 text-[#0E2841]" />
                </div>
                <div>
                  <span className="block text-[12.5px] font-semibold text-[#0E2841]">
                    Home Value Growth (CAGR)
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#64748B] mt-0.5">
                    <span>Assumption: {activeLevers.homeGrowthRate.toFixed(1)}%</span>
                    <span>|</span>
                    <span>Your Portfolio:</span>
                    <span className="px-1.5 py-0.2 bg-[#DCFCE7] text-[#15803D] font-bold rounded-[4px] text-[10.5px]">
                      {futureOutlookData.clientPortfolioCagr.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Col 3: Investment Property Growth */}
              <div className="flex items-center gap-3">
                <div className="w-[36px] h-[36px] rounded-[8px] bg-[#F0FAF5] flex items-center justify-center text-[#059669] shrink-0">
                  <Building2 className="w-4 h-4 text-[#059669]" />
                </div>
                <div>
                  <span className="block text-[12.5px] font-semibold text-[#0E2841]">
                    Investment Property Growth
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#64748B] mt-0.5">
                    <span>Assumption: {activeLevers.invGrowthRate.toFixed(1)}%</span>
                    <span>|</span>
                    <span>Your Portfolio:</span>
                    <span className="px-1.5 py-0.2 bg-[#DCFCE7] text-[#15803D] font-bold rounded-[4px] text-[10.5px]">
                      {(futureOutlookData.clientPortfolioCagr + 2.6).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Col 4: Investment Return */}
              <div className="flex items-center gap-3">
                <div className="w-[36px] h-[36px] rounded-[8px] bg-[#F7F3FF] flex items-center justify-center text-[#7C3AED] shrink-0">
                  <TrendingUp className="w-4 h-4 text-[#7C3AED]" />
                </div>
                <div>
                  <span className="block text-[12.5px] font-semibold text-[#0E2841]">
                    Investment Return
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#64748B] mt-0.5">
                    <span>Assumption: {globalAssumptions.investmentReturn.toFixed(1)}%</span>
                    <span>|</span>
                    <span>Your Portfolio:</span>
                    <span className="px-1.5 py-0.2 bg-[#DCFCE7] text-[#15803D] font-bold rounded-[4px] text-[10.5px]">
                      {(globalAssumptions.investmentReturn + 0.3).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main 2-Column Grid: LEFT = Dark Navy Chart Card, RIGHT = 3 Asset Assumption Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* LEFT COLUMN: Dark Navy Chart Card (lg:col-span-5) */}
            <div className="lg:col-span-5 bg-[#0B1E33] rounded-[16px] p-5 text-white flex flex-col justify-between border border-[#1E3A5F] shadow-lg">
              <div>
                <span className="text-[11.5px] font-medium text-white/70 block">
                  Projected Income – Scenario {activeScenario.toUpperCase()} ({activeScenario === "a" ? "Current Plan" : "What If"})
                </span>
                <div className="text-[36px] sm:text-[38px] font-black text-[#FBBF24] tracking-tight leading-tight my-1">
                  {fmtMoney(futureOutlookData.projectIncomeTotal)}
                </div>
                <p className="text-[11px] text-white/70 leading-snug">
                  per year after tax in FY{targetYear} · From total assets of $6.32M (in today&apos;s dollars)
                </p>

                <div className="flex items-center justify-between text-[12px] pt-3 pb-2 border-b border-white/10">
                  <span className="font-semibold text-white">
                    Income goal: {fmtMoney(activeLevers.incomeGoal)} p.a.
                  </span>
                  <span className="font-bold text-[#34D399]">
                    {Math.round((futureOutlookData.projectIncomeTotal / activeLevers.incomeGoal) * 100)}% of {fmtMoney(activeLevers.incomeGoal)}
                  </span>
                </div>

                {/* Legend Row */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] py-2.5 border-b border-white/10">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-[#2DD4BF] rounded-full inline-block" />
                    <span className="text-white/80">Home equity</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-[#F59E0B] rounded-full inline-block" />
                    <span className="text-white/80">Investment net equity</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-[#C084FC] rounded-full inline-block" />
                    <span className="text-white/80">Superannuation</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0 border-t border-dashed border-[#94A3B8] inline-block" />
                    <span className="text-white/60">Target income (goal)</span>
                  </div>
                </div>

                {/* SVG Chart directly on Dark Navy Background */}
                <div className="relative w-full pt-3 pb-1">
                  <svg
                    viewBox="0 0 540 220"
                    className="w-full h-[220px] overflow-visible select-none"
                  >
                    {/* Y-axis labels & dashed gridlines */}
                    {[
                      { val: "$10.0M", y: 20 },
                      { val: "$8.0M", y: 56 },
                      { val: "$6.0M", y: 92 },
                      { val: "$4.0M", y: 128 },
                      { val: "$2.0M", y: 164 },
                      { val: "$0", y: 198 },
                    ].map((tick) => (
                      <g key={tick.val}>
                        <text
                          x="38"
                          y={tick.y + 3}
                          textAnchor="end"
                          fontSize="10"
                          fill="#94A3B8"
                          fontFamily="sans-serif"
                        >
                          {tick.val}
                        </text>
                        <line
                          x1="45"
                          x2="520"
                          y1={tick.y}
                          y2={tick.y}
                          stroke="#1E293B"
                          strokeDasharray="3 3"
                          strokeWidth="1"
                        />
                      </g>
                    ))}

                    {/* Target income dashed line */}
                    <line
                      x1="45"
                      x2="520"
                      y1="194"
                      y2="194"
                      stroke="#94A3B8"
                      strokeDasharray="4 4"
                      strokeWidth="1.2"
                      strokeOpacity="0.8"
                    />

                    {/* 3 Glowing Spline Curves */}
                    {/* Home Equity Curve (Teal) */}
                    <path
                      d={futureOutlookData.pathHome}
                      fill="none"
                      stroke="#2DD4BF"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />

                    {/* Investment Net Equity Curve (Amber) */}
                    <path
                      d={futureOutlookData.pathInv}
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />

                    {/* Superannuation Curve (Purple) */}
                    <path
                      d={futureOutlookData.pathSuper}
                      fill="none"
                      stroke="#C084FC"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />

                    {/* Vertical dashed line at horizon */}
                    <line
                      x1={futureOutlookData.markerX}
                      x2={futureOutlookData.markerX}
                      y1="20"
                      y2="198"
                      stroke="#FFFFFF"
                      strokeDasharray="3 3"
                      strokeWidth="1.2"
                      strokeOpacity="0.6"
                    />

                    {/* Marker Dots on Curves at horizon */}
                    <circle
                      cx={futureOutlookData.markerX}
                      cy={futureOutlookData.markerYInv}
                      r="4.5"
                      fill="#F59E0B"
                      stroke="#0B1E33"
                      strokeWidth="2"
                    />
                    <circle
                      cx={futureOutlookData.markerX}
                      cy={futureOutlookData.markerYSuper}
                      r="4.5"
                      fill="#C084FC"
                      stroke="#0B1E33"
                      strokeWidth="2"
                    />
                    <circle
                      cx={futureOutlookData.markerX}
                      cy={futureOutlookData.markerYHome}
                      r="4.5"
                      fill="#2DD4BF"
                      stroke="#0B1E33"
                      strokeWidth="2"
                    />

                    {/* X-axis tick labels */}
                    {[
                      { label: "Today (FY2026)", x: 50 },
                      { label: "+5 years (FY2031)", x: 165 },
                      { label: "+10 years (FY2036)", x: 280 },
                      { label: "+15 years (FY2041)", x: 395 },
                      { label: "+20 years (FY2046)", x: 490 },
                    ].map((tick) => (
                      <text
                        key={tick.label}
                        x={tick.x}
                        y="214"
                        textAnchor="middle"
                        fontSize="9.5"
                        fill="#94A3B8"
                        fontFamily="sans-serif"
                      >
                        {tick.label}
                      </text>
                    ))}
                  </svg>
                </div>
              </div>

              {/* Bottom Sliders inside Dark Navy Card */}
              <div className="space-y-3.5 pt-4 border-t border-white/10 mt-2">
                {/* Slider 1: Years Until Retirement */}
                <div>
                  <div className="flex items-center justify-between text-[12px] font-medium text-white/90 mb-1">
                    <span>Years Until Retirement</span>
                    <span className="font-bold text-white">
                      {activeLevers.forecastHorizon} Years
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="35"
                    step="1"
                    value={activeLevers.forecastHorizon}
                    onChange={(e) =>
                      updateActiveLever("forecastHorizon", Number(e.target.value))
                    }
                    className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#38BDF8]"
                  />
                </div>

                {/* Slider 2: Income Goal (p.a.) */}
                <div>
                  <div className="flex items-center justify-between text-[12px] font-medium text-white/90 mb-1">
                    <span>Income Goal (p.a.)</span>
                    <span className="font-bold text-white">
                      {fmtMoney(activeLevers.incomeGoal)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="20000"
                    max="200000"
                    step="5000"
                    value={activeLevers.incomeGoal}
                    onChange={(e) =>
                      updateActiveLever("incomeGoal", Number(e.target.value))
                    }
                    className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#38BDF8]"
                  />
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: 3 Asset Assumption Cards (lg:col-span-7) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              {/* Card 1: Home (Owner Occupied) */}
              <div className="bg-[#F0F6FA] rounded-[14px] p-4 border border-[#DCE7F0] shadow-2xs">
                <div className="flex items-start justify-between pb-1.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-[34px] h-[34px] rounded-[8px] bg-[#0E2841] flex items-center justify-center text-white shrink-0">
                      <Home className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-['Poppins',sans-serif] text-[15px] font-bold text-[#0E2841] leading-tight">
                        Home (Owner Occupied)
                      </h3>
                      <p className="text-[11px] text-[#64748B] mt-0.5">
                        Home Value (Today): {fmtMoney(futureOutlookData.baseHomeVal)} | Net Equity: {fmtMoney(futureOutlookData.baseHomeEquity)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="block text-[10px] font-medium text-[#64748B]">
                      Projected Value – FY{targetYear}
                    </span>
                    <span className="block text-[18px] font-extrabold text-[#0E2841]">
                      {fmtMillions(futureOutlookData.projectedHomeVal)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-3 pt-3 border-t border-[#E2E8F0]/70">
                  {/* Slider: Home growth p.a. */}
                  <div>
                    <div className="flex items-center justify-between text-[11.5px] font-semibold text-[#0E2841] mb-1">
                      <span>Home growth p.a.</span>
                      <span className="font-bold text-[#0E2841]">
                        {activeLevers.homeGrowthRate.toFixed(1)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.1"
                      value={activeLevers.homeGrowthRate}
                      onChange={(e) =>
                        updateActiveLever("homeGrowthRate", parseFloat(e.target.value))
                      }
                      className="w-full h-1.5 bg-[#CBD5E1] rounded-lg appearance-none cursor-pointer accent-[#0E2841]"
                    />
                  </div>

                  {/* Slider: Extra repayments */}
                  <div>
                    <div className="flex items-center justify-between text-[11.5px] font-semibold text-[#0E2841] mb-1">
                      <span>Extra repayments</span>
                      <span className="font-bold text-[#0E2841]">
                        {fmtMoney(activeLevers.homeExtraRepayment)} p.m.
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="5000"
                      step="50"
                      value={activeLevers.homeExtraRepayment}
                      onChange={(e) =>
                        updateActiveLever("homeExtraRepayment", Number(e.target.value))
                      }
                      className="w-full h-1.5 bg-[#CBD5E1] rounded-lg appearance-none cursor-pointer accent-[#0E2841]"
                    />
                  </div>

                  {/* Slider: Downsize price (today) */}
                  <div>
                    <div className="flex items-center justify-between text-[11.5px] font-semibold text-[#0E2841] mb-1">
                      <span>Downsize price (today)</span>
                      <span className="font-bold text-[#0E2841]">
                        {fmtMoney(
                          activeLevers.homeDownsizerPrice <= 1000
                            ? activeLevers.homeDownsizerPrice * 1000
                            : activeLevers.homeDownsizerPrice
                        )}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1500000"
                      step="25000"
                      value={
                        activeLevers.homeDownsizerPrice <= 1000
                          ? activeLevers.homeDownsizerPrice * 1000
                          : activeLevers.homeDownsizerPrice
                      }
                      onChange={(e) =>
                        updateActiveLever("homeDownsizerPrice", Number(e.target.value))
                      }
                      className="w-full h-1.5 bg-[#CBD5E1] rounded-lg appearance-none cursor-pointer accent-[#0E2841]"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Investment Properties */}
              <div className="bg-[#F0FAF5] rounded-[14px] p-4 border border-[#D1EFE0] shadow-2xs">
                <div className="flex items-start justify-between pb-1.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-[34px] h-[34px] rounded-[8px] bg-[#059669] flex items-center justify-center text-white shrink-0">
                      <Building2 className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-['Poppins',sans-serif] text-[15px] font-bold text-[#0E2841] leading-tight">
                        Investment Properties
                      </h3>
                      <p className="text-[11px] text-[#64748B] mt-0.5">
                        Total: 3 properties | Current Value: $5.10M | Current Net Equity: $1.63M
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="block text-[10px] font-medium text-[#64748B]">
                      Projected Net Equity – FY{targetYear}
                    </span>
                    <span className="block text-[18px] font-extrabold text-[#059669]">
                      {fmtMillions(futureOutlookData.projectedInvEquity)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-3 pt-3 border-t border-[#A7F3D0]/60">
                  {/* Slider: Property growth (CAGR) */}
                  <div>
                    <div className="flex items-center justify-between text-[11.5px] font-semibold text-[#0E2841] mb-1">
                      <span>Property growth (CAGR)</span>
                      <span className="font-bold text-[#059669]">
                        {activeLevers.invGrowthRate.toFixed(1)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="12"
                      step="0.1"
                      value={activeLevers.invGrowthRate}
                      onChange={(e) =>
                        updateActiveLever("invGrowthRate", parseFloat(e.target.value))
                      }
                      className="w-full h-1.5 bg-[#CBD5E1] rounded-lg appearance-none cursor-pointer accent-[#059669]"
                    />
                  </div>

                  {/* Slider: Extra repayments */}
                  <div>
                    <div className="flex items-center justify-between text-[11.5px] font-semibold text-[#0E2841] mb-1">
                      <span>Extra repayments</span>
                      <span className="font-bold text-[#059669]">
                        {fmtMoney(activeLevers.invExtraRepayment)} p.m.
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="5000"
                      step="50"
                      value={activeLevers.invExtraRepayment}
                      onChange={(e) =>
                        updateActiveLever("invExtraRepayment", Number(e.target.value))
                      }
                      className="w-full h-1.5 bg-[#CBD5E1] rounded-lg appearance-none cursor-pointer accent-[#059669]"
                    />
                  </div>

                  {/* Dropdown: Additional investment */}
                  <div>
                    <div className="flex items-center justify-between text-[11.5px] font-semibold text-[#0E2841] mb-1">
                      <span>Additional investment</span>
                    </div>
                    <select
                      value={activeLevers.invAddlInvestment}
                      onChange={(e) =>
                        updateActiveLever("invAddlInvestment", Number(e.target.value))
                      }
                      className="w-full h-[32px] px-2.5 bg-white border border-[#CBD5E1] rounded-[6px] text-[12px] font-semibold text-[#0E2841] focus:outline-none focus:border-[#059669]"
                    >
                      <option value={0}>None</option>
                      <option value={250000}>+$250k at yr 5</option>
                      <option value={500000}>+$500k at yr 5</option>
                      <option value={1000000}>+$1.0M at yr 5</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Card 3: Superannuation */}
              <div className="bg-[#F7F3FF] rounded-[14px] p-4 border border-[#EAE2FA] shadow-2xs">
                <div className="flex items-start justify-between pb-1.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-[34px] h-[34px] rounded-[8px] bg-[#7C3AED] flex items-center justify-center text-white shrink-0">
                      <PiggyBank className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-['Poppins',sans-serif] text-[15px] font-bold text-[#0E2841] leading-tight">
                        Superannuation
                      </h3>
                      <p className="text-[11px] text-[#64748B] mt-0.5">
                        Current Balance: {fmtMoney(futureOutlookData.baseSuper)} | Contributions: $1,250 p.m.
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="block text-[10px] font-medium text-[#64748B]">
                      Projected Balance – FY{targetYear}
                    </span>
                    <span className="block text-[18px] font-extrabold text-[#7C3AED]">
                      {fmtMillions(futureOutlookData.projectedSuperBal)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 pt-3 border-t border-[#DDD6FE]/60">
                  {/* Slider: Return p.a. */}
                  <div>
                    <div className="flex items-center justify-between text-[11.5px] font-semibold text-[#0E2841] mb-1">
                      <span>Return p.a.</span>
                      <span className="font-bold text-[#7C3AED]">
                        {activeLevers.superReturnRate.toFixed(1)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="12"
                      step="0.1"
                      value={activeLevers.superReturnRate}
                      onChange={(e) =>
                        updateActiveLever("superReturnRate", parseFloat(e.target.value))
                      }
                      className="w-full h-1.5 bg-[#CBD5E1] rounded-lg appearance-none cursor-pointer accent-[#7C3AED]"
                    />
                  </div>

                  {/* Slider: Extra contribution */}
                  <div>
                    <div className="flex items-center justify-between text-[11.5px] font-semibold text-[#0E2841] mb-1">
                      <span>Extra contribution</span>
                      <span className="font-bold text-[#7C3AED]">
                        {fmtMoney(activeLevers.superExtraContrib)} p.m.
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="5000"
                      step="50"
                      value={activeLevers.superExtraContrib}
                      onChange={(e) =>
                        updateActiveLever("superExtraContrib", Number(e.target.value))
                      }
                      className="w-full h-1.5 bg-[#CBD5E1] rounded-lg appearance-none cursor-pointer accent-[#7C3AED]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Forecast Results (2046) */}
          <div className="pt-3">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="font-['Poppins',sans-serif] text-[18px] font-bold text-[#0E2841]">
                  Forecast Results ({targetYear})
                </h2>
                <p className="font-['Poppins',sans-serif] text-[13px] text-[#64748B]">
                  Projected Wealth &amp; Cash Flow Outcomes for {targetYear}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <span className="text-[12.5px] text-[#64748B]">
                  Based on {forecastHorizon}-year compounding model from FY2026
                </span>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() =>
                      openAddInsightModal("Portfolio-Wide", "Capital Growth")
                    }
                    className="bg-[#0E2841] hover:bg-[#163859] text-white px-4 py-2 rounded-[6px] text-[13px] font-medium transition-colors cursor-pointer"
                  >
                    + Add Insight
                  </button>
                )}
              </div>
            </div>

            {/* 3 Outcome Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: Home — Owner Occupied */}
              <div className="bg-[#F0F5FA] rounded-[16px] p-6 border border-[#E2E8F0]/40 relative min-h-[280px] flex flex-col justify-between overflow-hidden">
                <div>
                  <div className="flex items-center justify-between pb-3.5 border-b border-[#E2E8F0]/50">
                    <h3 className="font-['Poppins',sans-serif] text-[16px] font-bold text-[#0E2841]">
                      Home — Owner Occupied
                    </h3>
                    <span className="text-[13px] font-medium text-[#64748B]">
                      {targetYear}
                    </span>
                  </div>

                  <div className="mt-4">
                    <p className="text-[12px] font-medium text-[#64748B]">
                      {futureOutlookData.downsizerCostToday > 0
                        ? "Downsized Replacement Home Value"
                        : "Projected Home Value"}
                    </p>
                    <p className="text-[22px] font-bold text-[#0E2841] mt-0.5 mb-1.5">
                      {fmtMoney(futureOutlookData.finalProjectedHomeVal)}
                    </p>

                    {futureOutlookData.downsizerCostToday > 0 ? (
                      <div className="space-y-1 text-[11px] text-[#475569] leading-relaxed max-w-[230px]">
                        <span className="inline-block bg-[#0E2841]/10 text-[#0E2841] font-semibold px-2 py-0.5 rounded text-[10.5px] mb-1">
                          Downsizing Plan Active
                        </span>
                        <p>
                          Original Home: {fmtMoney(futureOutlookData.originalHomeVal)}
                        </p>
                        <p className="text-[#0E2841] font-medium">
                          Released Capital: {fmtMoney(futureOutlookData.releasedCapital)} after purchasing replacement home and eliminating mortgage.
                        </p>
                      </div>
                    ) : (
                      <p className="text-[11.5px] text-[#64748B] leading-relaxed max-w-[210px]">
                        Owner-occupied home equity compounds tax-free. Home value is kept separate from invested income capital.
                      </p>
                    )}
                  </div>
                </div>

                <img
                  src="/images/future-outlook/house.png"
                  alt="Home"
                  className="w-[110px] h-auto object-contain absolute bottom-3 right-3 pointer-events-none opacity-90"
                />
              </div>

              {/* Card 2: Invested Capital */}
              <div className="bg-[#FFF9F2] rounded-[16px] p-6 border border-[#FDE8B5]/40 relative min-h-[280px] flex flex-col justify-between overflow-hidden">
                <div>
                  <div className="flex items-center justify-between pb-3.5 border-b border-[#FDE8B5]/60">
                    <h3 className="font-['Poppins',sans-serif] text-[16px] font-bold text-[#0E2841]">
                      Invested Capital
                    </h3>
                    <span className="text-[13px] font-medium text-[#64748B]">
                      {targetYear}
                    </span>
                  </div>

                  <div className="mt-3.5 space-y-2.5">
                    <div>
                      <p className="text-[11.5px] font-medium text-[#64748B]">
                        Projected After-Tax Income
                      </p>
                      <p className="text-[20px] font-bold text-[#0E2841] mt-0.5">
                        {fmtMoney(futureOutlookData.projectedAfterTaxIncome)}
                        <span className="text-[13px] font-normal text-[#64748B]">
                          {" "}
                          / yr
                        </span>
                      </p>
                      <p className="text-[10px] text-[#94A3B8]">
                        At {globalAssumptions.investmentReturn}% return less {globalAssumptions.incomeTaxRate}% tax (3.5% net)
                      </p>
                    </div>

                    <div className="pt-1.5 border-t border-[#FDE8B5]/60">
                      <p className="text-[11.5px] font-medium text-[#64748B]">
                        Projected Invested Capital
                      </p>
                      <p className="text-[17px] font-bold text-[#B45309] mt-0.5">
                        {fmtMoney(futureOutlookData.projectedInvestedCapital)}
                      </p>
                      <div className="text-[10.5px] text-[#64748B] leading-tight mt-1 space-y-0.5 max-w-[230px]">
                        <p>
                          Net Property Equity: {fmtMoney(futureOutlookData.projectedInvEquity)}
                        </p>
                        {futureOutlookData.downsizeToInvestedCapital > 0 && (
                          <p className="text-[#15803D] font-medium">
                            + {fmtMoney(futureOutlookData.downsizeToInvestedCapital)} Downsizing Capital
                          </p>
                        )}
                        <p className="text-[#DC2626] font-medium">
                          - {fmtMoney(futureOutlookData.totalCgt)} Total CGT Deducted
                        </p>
                        <p className="text-[9.5px] text-[#94A3B8]">
                          (Pre-2027: {fmtMoney(futureOutlookData.cgtPre)} @ 50% disc · Post-2027: {fmtMoney(futureOutlookData.cgtPost)} CPI-indexed)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <img
                  src="/images/future-outlook/apartment.png"
                  alt="Investment Properties"
                  className="w-[95px] h-auto object-contain absolute bottom-3 right-3 pointer-events-none opacity-90"
                />
              </div>

              {/* Card 3: Superannuation */}
              <div className="bg-[#F3EFFD] rounded-[16px] p-6 border border-[#DDD6FE]/40 relative min-h-[280px] flex flex-col justify-between overflow-hidden">
                <div>
                  <div className="flex items-center justify-between pb-3.5 border-b border-[#DDD6FE]/60">
                    <h3 className="font-['Poppins',sans-serif] text-[16px] font-bold text-[#0E2841]">
                      Superannuation
                    </h3>
                    <span className="text-[13px] font-medium text-[#64748B]">
                      {targetYear}
                    </span>
                  </div>

                  <div className="mt-3.5 space-y-2.5">
                    <div>
                      <p className="text-[11.5px] font-medium text-[#64748B]">
                        Projected Super Balance
                      </p>
                      <p className="text-[20px] font-bold text-[#0E2841] mt-0.5">
                        {fmtMoney(futureOutlookData.projectedSuperBal)}
                      </p>
                      {futureOutlookData.downsizeToSuper > 0 && (
                        <p className="text-[10px] text-[#6D28D9] font-semibold mt-0.5">
                          Includes {fmtMoney(futureOutlookData.downsizeToSuper)} Downsizer contribution ({futureOutlookData.adultCount} adults @ $300k max)
                        </p>
                      )}
                    </div>

                    <div className="pt-1.5 border-t border-[#DDD6FE]/60">
                      <p className="text-[11.5px] font-medium text-[#64748B]">
                        Safe Pension Drawdown (5%)
                      </p>
                      <p className="text-[17px] font-bold text-[#7C3AED] mt-0.5">
                        {fmtMoney(futureOutlookData.projectedSuperPensionIncome)}
                        <span className="text-[12px] font-normal text-[#64748B]">
                          {" "}
                          / yr
                        </span>
                      </p>
                      <p className="text-[10.5px] text-[#64748B] leading-relaxed mt-1 max-w-[220px]">
                        Tax-free pension stream in retirement. Combined with Invested Capital, total passive income is ~{fmtMoney(futureOutlookData.projectedAfterTaxIncome + futureOutlookData.projectedSuperPensionIncome)}/yr.
                      </p>
                    </div>
                  </div>
                </div>

                <img
                  src="/images/future-outlook/coins.png"
                  alt="Superannuation"
                  className="w-[85px] h-auto object-contain absolute bottom-3 right-3 pointer-events-none opacity-90"
                />
              </div>
            </div>
          </div>

          {/* Bottom Insights Carousel for Future Outlook */}
          {renderInsightsCarousel(selectedMetric, "Portfolio-Wide")}
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 5: PORTFOLIO MANAGEMENT INSIGHTS                              */}
      {/* ================================================================= */}
      {activeTab === "insights" && (
        <div className="space-y-6 pt-2">
          {/* Card: Property Insights & Recommendations Table */}
          <div className="bg-white rounded-[12px] p-[24px] shadow-[0px_11px_18px_0px_rgba(0,0,0,0.04)]">
            {/* Table Header & Filters Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-y-4 gap-x-6 mb-6">
              {/* Left: Section Title & prominent Filter by Property */}
              <div className="flex flex-wrap items-center gap-4 shrink-0">
                <h2 className="text-[18px] font-bold text-[#0e2841] whitespace-nowrap">
                  Property Insights &amp; Recommendations (
                  {filteredInsights.length})
                </h2>

                {/* Filter by Property matching user annotation */}
                <div className="flex items-center gap-2">
                  <span className="text-[12.5px] font-semibold text-[#64748B] whitespace-nowrap">
                    Filter by Property:
                  </span>
                  <div className="relative">
                    <select
                      value={propertyFilter}
                      onChange={(e) => setPropertyFilter(e.target.value)}
                      className={`h-[32px] pl-2.5 pr-7 text-[12.5px] rounded-[6px] border font-medium cursor-pointer transition-colors appearance-none focus:outline-none focus:ring-2 focus:ring-[#0e2841]/20 ${
                        propertyFilter !== "All"
                          ? "bg-[#0e2841] text-white border-[#0e2841] font-semibold"
                          : "bg-white border-[#CBD5E1] text-[#0e2841] hover:border-[#94A3B8]"
                      }`}
                    >
                      <option value="All" className="bg-white text-[#0e2841]">
                        All Properties ({insights.length})
                      </option>
                      {availableProperties.map((p) => {
                        const count = insights.filter(
                          (i) => i.property === p
                        ).length;
                        return (
                          <option
                            key={p}
                            value={p}
                            className="bg-white text-[#0e2841]"
                          >
                            {p} {count > 0 ? `(${count})` : ""}
                          </option>
                        );
                      })}
                    </select>
                    <ChevronDown
                      className={`w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${
                        propertyFilter !== "All"
                          ? "text-white"
                          : "text-[#64748B]"
                      }`}
                    />
                  </div>
                </div>

                {/* Companion Year filter */}
                <div className="relative">
                  <select
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                    title="Filter by Financial Year"
                    className={`h-[32px] pl-2 pr-6 text-[12px] rounded-[6px] border font-medium cursor-pointer transition-colors appearance-none focus:outline-none focus:ring-2 focus:ring-[#0e2841]/20 ${
                      yearFilter !== "All"
                        ? "bg-[#0e2841] text-white border-[#0e2841] font-semibold"
                        : "bg-white border-[#CBD5E1] text-[#64748B] hover:border-[#94A3B8]"
                    }`}
                  >
                    <option value="All" className="bg-white text-[#0e2841]">
                      All FY
                    </option>
                    {availableYears.map((fy) => {
                      const count = insights.filter(
                        (i) => String(i.fy) === String(fy)
                      ).length;
                      return (
                        <option
                          key={fy}
                          value={fy}
                          className="bg-white text-[#0e2841]"
                        >
                          FY{fy} {count > 0 ? `(${count})` : ""}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown
                    className={`w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                      yearFilter !== "All" ? "text-white" : "text-[#64748B]"
                    }`}
                  />
                </div>

                {/* Quick clear button if filtered */}
                {(propertyFilter !== "All" || yearFilter !== "All") && (
                  <button
                    type="button"
                    onClick={() => {
                      setPropertyFilter("All");
                      setYearFilter("All");
                    }}
                    className="p-1 text-[#64748B] hover:text-[#DC2626] rounded-[4px] hover:bg-white transition-colors cursor-pointer"
                    title="Clear property & year filters"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Right: Priority Pills & Add Insight Button */}
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-[12.5px] text-[#8C9BA8] whitespace-nowrap">
                    Filter by:
                  </span>
                  <div className="bg-[#f2f1f2] rounded-[8px] p-[3px] inline-flex items-center gap-1">
                    {(["All", "High", "Medium", "Low"] as const).map(
                      (prio) => {
                        const isActive = priorityFilter === prio;
                        const count =
                          prio === "All"
                            ? priorityCounts.all
                            : prio === "High"
                            ? priorityCounts.high
                            : prio === "Medium"
                            ? priorityCounts.medium
                            : priorityCounts.low;
                        return (
                          <button
                            key={prio}
                            type="button"
                            onClick={() => setPriorityFilter(prio)}
                            className={`h-[28px] px-[10px] text-[12px] transition-all cursor-pointer whitespace-nowrap ${
                              isActive
                                ? "bg-white rounded-[5px] font-semibold text-[#1a1c1e] shadow-2xs"
                                : "bg-transparent rounded-[5px] font-medium text-[#64748B] hover:text-[#1a1c1e]"
                            }`}
                          >
                            {prio === "All"
                              ? `All Priorities (${count})`
                              : `${prio} (${count})`}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                {/* Reset Filters button if any filter is active */}
                {(propertyFilter !== "All" ||
                  yearFilter !== "All" ||
                  priorityFilter !== "All") && (
                  <button
                    type="button"
                    onClick={() => {
                      setPropertyFilter("All");
                      setYearFilter("All");
                      setPriorityFilter("All");
                    }}
                    className="text-[12px] font-medium text-[#DC2626] hover:underline cursor-pointer px-1 whitespace-nowrap"
                    title="Reset all filters"
                  >
                    Reset
                  </button>
                )}

                {/* Add Insight Button */}
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => openAddInsightModal()}
                    className="bg-[#0e2841] hover:bg-[#163859] text-white h-[36px] px-[16px] rounded-[8px] text-[13px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs ml-auto xl:ml-0 whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Insight</span>
                  </button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1100px]">
                <thead>
                  <tr className="border-b border-[#F0F1F3] text-[12px] font-semibold text-[#8C9BA8] uppercase tracking-wider">
                    <th className="py-3.5 px-3">
                      <span className="inline-flex items-center gap-1 select-none">
                        FY <ChevronDown className="w-3 h-3 text-[#A0AEC0]" />
                      </span>
                    </th>
                    <th className="py-3.5 px-3">
                      <span className="inline-flex items-center gap-1 select-none">
                        Screen <ChevronDown className="w-3 h-3 text-[#A0AEC0]" />
                      </span>
                    </th>
                    <th className="py-3.5 px-3 relative">
                      <div className="relative inline-block">
                        <button
                          type="button"
                          onClick={() => setIsPropertyHeaderMenuOpen((prev) => !prev)}
                          className="inline-flex items-center gap-1 select-none text-[#0e2841] font-bold hover:text-[#163859] transition-colors cursor-pointer"
                          title="Click to filter by property"
                        >
                          <span>Property</span>
                          <ChevronDown className="w-3 h-3 text-[#0e2841]" />
                        </button>
                        {isPropertyHeaderMenuOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-20"
                              onClick={() => setIsPropertyHeaderMenuOpen(false)}
                            />
                            <div className="absolute left-0 top-full mt-1.5 w-[240px] bg-white rounded-[10px] shadow-2xl border border-[#CBD5E1] p-2 z-30 normal-case tracking-normal">
                              <div className="text-[11px] font-bold text-[#64748B] uppercase px-2.5 py-1 mb-1 border-b border-[#F1F5F9] flex items-center justify-between">
                                <span>Filter by Property</span>
                                {propertyFilter !== "All" && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPropertyFilter("All");
                                      setIsPropertyHeaderMenuOpen(false);
                                    }}
                                    className="text-[10.5px] text-[#DC2626] hover:underline cursor-pointer lowercase"
                                  >
                                    clear
                                  </button>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setPropertyFilter("All");
                                  setIsPropertyHeaderMenuOpen(false);
                                }}
                                className={`w-full text-left px-2.5 py-2 rounded-[6px] text-[12.5px] font-medium flex items-center justify-between transition-colors ${
                                  propertyFilter === "All"
                                    ? "bg-[#0e2841] text-white font-semibold"
                                    : "text-[#1A1C1E] hover:bg-[#F8FAFC]"
                                }`}
                              >
                                <span>All Properties</span>
                                <span
                                  className={`text-[11px] ${
                                    propertyFilter === "All"
                                      ? "text-white/80"
                                      : "text-[#64748B]"
                                  }`}
                                >
                                  ({insights.length})
                                </span>
                              </button>
                              {availableProperties.map((p) => {
                                const count = insights.filter(
                                  (i) => i.property === p
                                ).length;
                                const isSelected = propertyFilter === p;
                                return (
                                  <button
                                    key={p}
                                    type="button"
                                    onClick={() => {
                                      setPropertyFilter(p);
                                      setIsPropertyHeaderMenuOpen(false);
                                    }}
                                    className={`w-full text-left px-2.5 py-2 rounded-[6px] text-[12.5px] font-medium flex items-center justify-between transition-colors mt-0.5 ${
                                      isSelected
                                        ? "bg-[#0e2841] text-white font-semibold"
                                        : "text-[#1A1C1E] hover:bg-[#F8FAFC]"
                                    }`}
                                  >
                                    <span className="truncate pr-2">{p}</span>
                                    {count > 0 && (
                                      <span
                                        className={`text-[11px] shrink-0 ${
                                          isSelected
                                            ? "text-white/80"
                                            : "text-[#64748B]"
                                        }`}
                                      >
                                        ({count})
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    </th>
                    <th className="py-3.5 px-3">
                      <span className="inline-flex items-center gap-1 select-none">
                        Maintenance insight <ChevronDown className="w-3 h-3 text-[#A0AEC0]" />
                      </span>
                    </th>
                    <th className="py-3.5 px-3">
                      <span className="inline-flex items-center gap-1 select-none">
                        Metric <ChevronDown className="w-3 h-3 text-[#A0AEC0]" />
                      </span>
                    </th>
                    <th className="py-3.5 px-3">
                      <span className="inline-flex items-center gap-1 select-none">
                        Heading <ChevronDown className="w-3 h-3 text-[#A0AEC0]" />
                      </span>
                    </th>
                    <th className="py-3.5 px-3">
                      <span className="inline-flex items-center gap-1 select-none">
                        Insight <ChevronDown className="w-3 h-3 text-[#A0AEC0]" />
                      </span>
                    </th>
                    <th className="py-3.5 px-3">
                      <span className="inline-flex items-center gap-1 select-none">
                        Recommendation <ChevronDown className="w-3 h-3 text-[#A0AEC0]" />
                      </span>
                    </th>
                    <th className="py-3.5 px-3">
                      <span className="inline-flex items-center gap-1 select-none text-[#8C9BA8] font-semibold uppercase tracking-wider text-[12px]">
                        PRIORITY <span className="text-[#1A1C1E] text-[8px] leading-none">▼</span>
                      </span>
                    </th>
                    <th className="py-3.5 px-3">
                      <span className="inline-flex items-center gap-1 select-none">
                        Owner <ChevronDown className="w-3 h-3 text-[#A0AEC0]" />
                      </span>
                    </th>
                    <th className="py-3.5 px-3">
                      <span className="inline-flex items-center gap-1 select-none">
                        Action <ChevronDown className="w-3 h-3 text-[#A0AEC0]" />
                      </span>
                    </th>
                    <th className="py-3.5 px-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F6F7F9] text-[13px] text-[#1A1C1E]">
                  {filteredInsights.length === 0 ? (
                    <tr>
                      <td
                        colSpan={12}
                        className="py-12 text-center text-[#64748B]"
                      >
                        <p className="text-[15px] font-medium text-[#0e2841] mb-1">
                          No insights found matching the selected filters
                        </p>
                        <p className="text-[13px] text-[#64748B] mb-4">
                          Try adjusting your property, year, or priority
                          filters, or add a new insight.
                        </p>
                        <div className="flex items-center justify-center gap-3">
                          {(propertyFilter !== "All" ||
                            yearFilter !== "All" ||
                            priorityFilter !== "All") && (
                            <button
                              type="button"
                              onClick={() => {
                                setPropertyFilter("All");
                                setYearFilter("All");
                                setPriorityFilter("All");
                              }}
                              className="text-[12.5px] font-medium text-[#0e2841] border border-[#CBD5E1] px-3.5 py-1.5 rounded-[8px] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
                            >
                              Reset Filters
                            </button>
                          )}
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => openAddInsightModal()}
                              className="bg-[#0e2841] hover:bg-[#163859] text-white px-3.5 py-1.5 rounded-[8px] text-[12.5px] font-medium transition-colors cursor-pointer"
                            >
                              + Add Insight
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredInsights.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => handleSelectRow(item)}
                        className="transition-colors hover:bg-[#F4F7FA] cursor-pointer group"
                        title="Click to review / edit this insight in popup"
                      >
                        <td className="py-3.5 px-3 font-medium text-[#0e2841] whitespace-nowrap">
                          {item.fy}
                        </td>
                        <td className="py-3.5 px-3 whitespace-nowrap text-[#475569]">
                          {item.screen}
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-[#0e2841] whitespace-nowrap">
                          {item.property}
                        </td>
                        <td className="py-3.5 px-3 whitespace-nowrap text-[#475569]">
                          {item.maintenanceInsight}
                        </td>
                        <td className="py-3.5 px-3 whitespace-nowrap text-[#475569]">
                          {item.metric}
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-[#0e2841] whitespace-nowrap group-hover:text-[#163859] group-hover:underline">
                          {item.heading}
                        </td>
                        <td
                          className="py-3.5 px-3 max-w-[220px] truncate text-[#475569]"
                          title={item.insight}
                        >
                          {item.insight}
                        </td>
                        <td
                          className="py-3.5 px-3 max-w-[220px] truncate text-[#475569]"
                          title={item.recommendation}
                        >
                          {item.recommendation}
                        </td>
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span className="font-semibold text-[#1a1c1e] text-[13.5px]">
                            {item.priority}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 whitespace-nowrap text-[#475569]">
                          {item.owner}
                        </td>
                        <td className="py-3.5 px-3 whitespace-nowrap text-[#475569]">
                          {item.action}
                        </td>
                        <td className="py-3.5 px-3 text-[#8C9BA8] whitespace-nowrap">
                          {item.notes}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: ADD / REVIEW INSIGHT & RECOMMENDATION                      */}
      {/* ================================================================= */}
      {isAddInsightOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-center items-start sm:items-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-[16px] w-full max-w-[620px] shadow-2xl relative my-auto flex flex-col max-h-[calc(100vh-2rem)] animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
            {/* Header with Navigation Arrows to scroll forward and back across recorded insights */}
            <div className="shrink-0 p-4 sm:p-5 pb-3 border-b border-[#F0F1F3] flex items-center justify-between bg-white">
              {/* Left Arrow (Previous recorded insight) - Orange accented per user mockup */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={handlePrevInsight}
                  disabled={!hasPrevInsight}
                  className="w-[36px] h-[36px] rounded-full bg-[#FFF7ED] border border-[#F97316] text-[#EA580C] hover:bg-[#FFEDD5] disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer shadow-xs active:scale-95"
                  title={
                    hasPrevInsight
                      ? isNewInsightMode
                        ? "Back to last recorded insight"
                        : "Previous recorded insight (← Arrow Left)"
                      : "No previous insight"
                  }
                >
                  <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                </button>
                {filteredInsights.length > 0 && (
                  <span className="text-[12px] font-bold text-[#EA580C] bg-[#FFF7ED] px-2 py-0.5 rounded-full border border-[#FED7AA] hidden sm:inline">
                    {isNewInsightMode
                      ? "New"
                      : `${currentInsightIndex + 1} of ${filteredInsights.length}`}
                  </span>
                )}
              </div>

              {/* Center Title and Status Badge */}
              <div className="text-center px-1">
                <h2 className="text-[17px] sm:text-[19px] font-bold text-[#0e2841] font-['Poppins',sans-serif] leading-tight">
                  {isNewInsightMode
                    ? `Add Insight & Recommendation FY${newInsightFy || reviewYear}`
                    : `Review Insight FY${
                        filteredInsights[currentInsightIndex]?.fy ||
                        newInsightFy ||
                        reviewYear
                      }`}
                </h2>
                <div className="flex items-center justify-center gap-2 mt-0.5">
                  <span
                    className={`text-[10.5px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      isNewInsightMode
                        ? "bg-[#EBF7EE] text-[#18794E]"
                        : "bg-[#EEF4F9] text-[#0e2841]"
                    }`}
                  >
                    {isNewInsightMode
                      ? `New Insight (${filteredInsights.length} matching)`
                      : `Insight ${currentInsightIndex + 1} of ${
                          filteredInsights.length
                        } matching`}
                  </span>
                  {!isNewInsightMode && (
                    <button
                      type="button"
                      onClick={() => openAddInsightModal()}
                      className="text-[11px] font-semibold text-[#0e2841] hover:underline cursor-pointer flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add New</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Right Arrow (Next recorded insight / New) - Orange accented per user mockup & Close Button */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={handleNextInsight}
                  disabled={!hasNextInsight && !(!isNewInsightMode && currentInsightIndex === filteredInsights.length - 1)}
                  className="w-[36px] h-[36px] rounded-full bg-[#FFF7ED] border border-[#F97316] text-[#EA580C] hover:bg-[#FFEDD5] disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer shadow-xs active:scale-95"
                  title={
                    currentInsightIndex < filteredInsights.length - 1
                      ? "Next recorded insight (→ Arrow Right)"
                      : currentInsightIndex === filteredInsights.length - 1
                      ? "Go to new insight form"
                      : "At latest entry"
                  }
                >
                  <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddInsightOpen(false)}
                  className="w-[34px] h-[34px] rounded-full bg-[#0e2841] text-white flex items-center justify-center hover:bg-[#163859] transition-colors cursor-pointer shadow-2xs ml-1"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* In-Modal Filter Bar: Filter what you scroll through in this popup */}
            <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-[12px]">
              <div className="flex items-center gap-1.5 font-medium text-[#475569]">
                <Filter className="w-3.5 h-3.5 text-[#0e2841]" />
                <span>Filter list:</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Property Filter */}
                <select
                  value={propertyFilter}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPropertyFilter(val);
                    const nextList = insights.filter((i) => {
                      if (priorityFilter !== "All" && i.priority !== priorityFilter)
                        return false;
                      if (val !== "All" && i.property !== val) return false;
                      if (yearFilter !== "All" && String(i.fy) !== String(yearFilter))
                        return false;
                      return true;
                    });
                    if (nextList.length > 0) {
                      loadInsightFromItem(nextList[0], 0);
                    }
                  }}
                  className="h-[28px] px-2 rounded-[6px] bg-white border border-[#CBD5E1] text-[#0e2841] font-medium text-[12px] focus:outline-none cursor-pointer max-w-[140px] truncate"
                  title="Filter insights by property"
                >
                  <option value="All">All Properties</option>
                  {availableProperties.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>

                {/* Year Filter */}
                <select
                  value={yearFilter}
                  onChange={(e) => {
                    const val = e.target.value;
                    setYearFilter(val);
                    const nextList = insights.filter((i) => {
                      if (priorityFilter !== "All" && i.priority !== priorityFilter)
                        return false;
                      if (propertyFilter !== "All" && i.property !== propertyFilter)
                        return false;
                      if (val !== "All" && String(i.fy) !== String(val))
                        return false;
                      return true;
                    });
                    if (nextList.length > 0) {
                      loadInsightFromItem(nextList[0], 0);
                    }
                  }}
                  className="h-[28px] px-2 rounded-[6px] bg-white border border-[#CBD5E1] text-[#0e2841] font-medium text-[12px] focus:outline-none cursor-pointer"
                  title="Filter insights by financial year"
                >
                  <option value="All">All Years</option>
                  {availableYears.map((fy) => (
                    <option key={fy} value={fy}>
                      FY{fy}
                    </option>
                  ))}
                </select>

                {/* Priority Filter */}
                <select
                  value={priorityFilter}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    setPriorityFilter(val);
                    const nextList = insights.filter((i) => {
                      if (val !== "All" && i.priority !== val) return false;
                      if (propertyFilter !== "All" && i.property !== propertyFilter)
                        return false;
                      if (yearFilter !== "All" && String(i.fy) !== String(yearFilter))
                        return false;
                      return true;
                    });
                    if (nextList.length > 0) {
                      loadInsightFromItem(nextList[0], 0);
                    }
                  }}
                  className="h-[28px] px-2 rounded-[6px] bg-white border border-[#CBD5E1] text-[#0e2841] font-medium text-[12px] focus:outline-none cursor-pointer"
                  title="Filter insights by priority"
                >
                  <option value="All">All Priorities</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>

                {(propertyFilter !== "All" ||
                  yearFilter !== "All" ||
                  priorityFilter !== "All") && (
                  <button
                    type="button"
                    onClick={() => {
                      setPropertyFilter("All");
                      setYearFilter("All");
                      setPriorityFilter("All");
                      if (insights.length > 0) {
                        loadInsightFromItem(insights[0], 0);
                      }
                    }}
                    className="text-[11.5px] text-[#DC2626] hover:underline font-semibold cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Form wrapping body and sticky footer */}
            <form
              id="insightForm"
              onSubmit={handleAddInsightSubmit}
              className="flex flex-col flex-1 overflow-hidden"
            >
              {/* Scrollable Form Body */}
              <div className="overflow-y-auto px-5 sm:px-6 py-4 space-y-3.5 text-[13px] flex-1">
                {/* Top Row: Year, Property, Metric */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-[#1a1c1e] mb-1 text-[12.5px]">
                    Financial Year (FY)
                  </label>
                  <select
                    value={newInsightFy}
                    onChange={(e) => setNewInsightFy(e.target.value)}
                    className="w-full h-[40px] px-3 rounded-[8px] bg-[#f6f9fb] border border-[#dce4e8] text-[#1a1c1e] text-[13px] focus:outline-none focus:border-[#0e2841] transition-colors cursor-pointer"
                  >
                    {availableYears.map((fy) => (
                      <option key={fy} value={fy}>
                        FY{fy}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#1a1c1e] mb-1 text-[12.5px]">
                    Select Property
                  </label>
                  <select
                    value={newInsightProperty}
                    onChange={(e) => setNewInsightProperty(e.target.value)}
                    className="w-full h-[40px] px-3 rounded-[8px] bg-[#f6f9fb] border border-[#dce4e8] text-[#1a1c1e] text-[13px] focus:outline-none focus:border-[#0e2841] transition-colors cursor-pointer"
                  >
                    <option value="Portfolio-Wide">Portfolio-Wide</option>
                    {propertiesList
                      .filter((p) => p.id !== "empty-prop")
                      .map((p) => (
                        <option key={p.id} value={p.address}>
                          {p.address}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#1a1c1e] mb-1 text-[12.5px]">
                    Metric / Area
                  </label>
                  <select
                    value={newInsightMetric}
                    onChange={(e) => setNewInsightMetric(e.target.value)}
                    className="w-full h-[40px] px-3 rounded-[8px] bg-[#f6f9fb] border border-[#dce4e8] text-[#1a1c1e] text-[13px] focus:outline-none focus:border-[#0e2841] transition-colors cursor-pointer"
                  >
                    <option value="Rental Income">Rental Income</option>
                    <option value="Rental Yield">Rental Yield</option>
                    <option value="Valuation">Valuation</option>
                    <option value="Capital Growth">Capital Growth</option>
                    <option value="Operating Expenses">
                      Operating Expenses
                    </option>
                    <option value="Debt & Refinancing">
                      Debt &amp; Refinancing
                    </option>
                    <option value="Cash Flow">Cash Flow</option>
                    <option value="Equity & LVR">Equity &amp; LVR</option>
                    <option value="Portfolio Performance">
                      Portfolio Performance
                    </option>
                    <option value="Future Outlook">Future Outlook</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#1a1c1e] mb-1 text-[12.5px]">
                  Heading <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newInsightHeading}
                  onChange={(e) => setNewInsightHeading(e.target.value)}
                  placeholder={`e.g. ${
                    newInsightMetric || "Rental Income"
                  } Review`}
                  className="w-full h-[40px] px-3 rounded-[8px] bg-[#f6f9fb] border border-[#dce4e8] text-[#1a1c1e] text-[13px] focus:outline-none focus:border-[#0e2841]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#1a1c1e] mb-1 text-[12.5px]">
                  Observation / Insight
                </label>
                <textarea
                  rows={2}
                  value={newInsightObservation}
                  onChange={(e) => setNewInsightObservation(e.target.value)}
                  placeholder="Enter observation..."
                  className="w-full p-2.5 sm:p-3 rounded-[8px] bg-[#f6f9fb] border border-[#dce4e8] text-[#1a1c1e] text-[13px] focus:outline-none focus:border-[#0e2841]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#1a1c1e] mb-1 text-[12.5px]">
                  Recommendation
                </label>
                <textarea
                  rows={2}
                  value={newInsightRecommendation}
                  onChange={(e) => setNewInsightRecommendation(e.target.value)}
                  placeholder="Enter recommendation..."
                  className="w-full p-2.5 sm:p-3 rounded-[8px] bg-[#f6f9fb] border border-[#dce4e8] text-[#1a1c1e] text-[13px] focus:outline-none focus:border-[#0e2841]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#1a1c1e] mb-1 text-[12.5px]">
                  Priority
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {(["High", "Medium", "Low"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNewInsightPriority(p)}
                      className={`h-[36px] rounded-[8px] font-medium text-[13px] border transition-colors cursor-pointer ${
                        newInsightPriority === p
                          ? "bg-[#0e2841] text-white border-[#0e2841]"
                          : "bg-[#f6f9fb] text-[#434750] border-[#dce4e8] hover:border-[#0e2841]"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#1a1c1e] mb-1 text-[12.5px]">
                    Owner
                  </label>
                  <select
                    value={newInsightOwner}
                    onChange={(e) => setNewInsightOwner(e.target.value)}
                    className="w-full h-[40px] px-3 rounded-[8px] bg-[#f6f9fb] border border-[#dce4e8] text-[#1a1c1e] text-[13px] focus:outline-none focus:border-[#0e2841] transition-colors cursor-pointer"
                  >
                    <option value="Adviser">Adviser</option>
                    <option value="Client">Client</option>
                    <option value="Mortgage Broker">Mortgage Broker</option>
                    <option value="Property Manager">Property Manager</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#1a1c1e] mb-1 text-[12.5px]">
                    Target Action
                  </label>
                  <input
                    type="text"
                    value={newInsightAction}
                    onChange={(e) => setNewInsightAction(e.target.value)}
                    placeholder="e.g. Reset rent Q3"
                    className="w-full h-[40px] px-3 rounded-[8px] bg-[#f6f9fb] border border-[#dce4e8] text-[#1a1c1e] text-[13px] focus:outline-none focus:border-[#0e2841]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#1a1c1e] mb-1 text-[12.5px]">
                  Notes
                </label>
                <input
                  type="text"
                  value={newInsightNotes}
                  onChange={(e) => setNewInsightNotes(e.target.value)}
                  placeholder="Optional notes..."
                  className="w-full h-[40px] px-3 rounded-[8px] bg-[#f6f9fb] border border-[#dce4e8] text-[#1a1c1e] text-[13px] focus:outline-none focus:border-[#0e2841]"
                />
              </div>
              </div>

              {/* Sticky Modal Footer */}
              <div className="shrink-0 px-5 sm:px-6 py-3 border-t border-[#F0F1F3] bg-[#FAFAFA] flex items-center justify-between gap-3">
                <div>
                  {editingInsightId && (
                    <button
                      type="button"
                      onClick={handleDeleteCurrentInsight}
                      className="h-[38px] px-3.5 rounded-[8px] border border-red-200 text-red-600 hover:bg-red-50 text-[12.5px] font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  {insightSaveMsg && (
                    <span
                      className={`text-[12.5px] font-medium animate-in fade-in ${
                        insightSaveMsg.includes("Failed") ||
                        insightSaveMsg.includes("Please")
                          ? "text-[#DC2626]"
                          : "text-[#18794E]"
                      }`}
                    >
                      {insightSaveMsg}
                    </span>
                  )}
                  {editingInsightId && (
                    <button
                      type="button"
                      onClick={() => openAddInsightModal()}
                      className="h-[38px] px-3.5 rounded-[8px] border border-[#0e2841] text-[#0e2841] hover:bg-[#f0f4f8] text-[12.5px] font-medium transition-colors cursor-pointer"
                    >
                      + New Insight
                    </button>
                  )}
                  {canEdit ? (
                    <button
                      type="submit"
                      disabled={isSubmittingInsight}
                      className="bg-[#0e2841] hover:bg-[#163859] disabled:opacity-50 disabled:cursor-not-allowed text-white h-[38px] px-6 rounded-[8px] text-[13px] font-medium transition-colors cursor-pointer shadow-xs flex items-center gap-2"
                    >
                      {isSubmittingInsight ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Updating...</span>
                        </>
                      ) : (
                        <span>
                          {editingInsightId ? "Update Insight" : "Save Insight"}
                        </span>
                      )}
                    </button>
                  ) : (
                    <span className="text-[12px] text-[#64748B] italic px-2">
                      Read-only report mode
                    </span>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
