"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ChevronDown,
  Pencil,
  Clock,
  Route,
  Plus,
  X,
  Home,
  Building2,
  PiggyBank,
} from "lucide-react";
import {
  createInsightApi,
  updateReviewApi,
  saveFutureOutlookApi,
} from "@/lib/api";

export interface ReviewInsightItem {
  id: string;
  fy: string;
  screen: string;
  property: string;
  maintenanceInsight: string;
  metric: string;
  heading: string;
  insight: string;
  recommendation: string;
  priority: "High" | "Medium" | "Low";
  owner: string;
  action: string;
  notes: string;
}

interface ReviewWorkspaceReportProps {
  householdId?: string;
  reviewId?: string;
  dbHousehold?: any;
  onDataChanged?: () => Promise<void> | void;
  householdName?: string;
  reviewYear?: string;
  reviewStatus?: "Completed" | "In Progress";
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

export default function ReviewWorkspaceReport({
  householdId = "",
  reviewId = "",
  dbHousehold,
  onDataChanged,
  householdName = "Harrison Family",
  reviewYear = "2026",
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
      const yieldPct = val > 0 ? ((wkRent * 52) / val) * 100 : 0;
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
  const [forecastHorizon, setForecastHorizon] = useState<number>(20);
  const [homeGrowthRate, setHomeGrowthRate] = useState<number>(3.0);
  const [homeExtraRepayment, setHomeExtraRepayment] = useState<number>(800);
  const [homeDownsizerPrice, setHomeDownsizerPrice] = useState<number>(250);

  const [invGrowthRate, setInvGrowthRate] = useState<number>(5.0);
  const [invExtraRepayment, setInvExtraRepayment] = useState<number>(1250);
  const [invAddlInvestment, setInvAddlInvestment] = useState<number>(0);

  const [superReturnRate, setSuperReturnRate] = useState<number>(5.0);
  const [superExtraContrib, setSuperExtraContrib] = useState<number>(1250);
  const [incomeGoal, setIncomeGoal] = useState<number>(60000);
  const [chartHoverYear, setChartHoverYear] = useState<number | null>(null);

  // Tab 5: Portfolio Management Insights states (loaded from DB)
  const [insights, setInsights] = useState<ReviewInsightItem[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<
    "All" | "High" | "Medium" | "Low"
  >("All");

  // Add Insight Modal states
  const [isAddInsightOpen, setIsAddInsightOpen] = useState(false);
  const [newInsightProperty, setNewInsightProperty] = useState("");
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

  useEffect(() => {
    if (propertiesList.length > 0 && !newInsightProperty) {
      setNewInsightProperty(propertiesList[0].address);
    }
  }, [propertiesList, newInsightProperty]);

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

  const handleAddInsightSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInsightHeading.trim()) return;
    const screenName =
      activeTab === "property-analysis"
        ? propertySubView === "cash-management"
          ? "Cash Management"
          : propertySubView === "capital-management"
          ? "Capital Management"
          : "Property Analysis"
        : activeTab === "portfolio-overview"
        ? "Portfolio Overview"
        : activeTab === "future-outlook"
        ? "Future Outlook"
        : "Executive Summary";

    if (effectiveReviewId) {
      await createInsightApi(effectiveReviewId, {
        criterionTitle: newInsightHeading.trim(),
        screen: screenName,
        propertyName: newInsightProperty || currentProperty.address,
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
        adviserNotes: newInsightNotes.trim() || `Added in FY${reviewYear} review`,
      });
      await onDataChanged?.();
    }

    setNewInsightHeading("");
    setNewInsightObservation("");
    setNewInsightRecommendation("");
    setNewInsightAction("");
    setNewInsightNotes("");
    setIsAddInsightOpen(false);
  };

  const targetYear = 2026 + forecastHorizon;

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
      invProps,
      invVal,
      invLoans,
      invEquity,
      invLvr,
      ooVal,
      ooLoans,
      ooEquity,
      superBal,
      projectedHomeVal,
      projectedInvEquity,
      projectedAfterTaxIncome,
    };
  }, [propertiesList, dbHousehold, homeGrowthRate, invGrowthRate, forecastHorizon]);

  // Dynamic calculations for Future Outlook interactive graph and sliders
  const futureOutlookData = useMemo(() => {
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
      : 0;

    const baseHomeVal = dbOoVal > 0 ? dbOoVal : 2563126;
    const baseHomeLoans = dbOoLoans > 0 ? dbOoLoans : 933126;
    const baseHomeEquity = Math.max(0, baseHomeVal - baseHomeLoans);

    const baseInvVal = dbInvVal > 0 ? dbInvVal : 2500000;
    const baseInvLoans = dbInvLoans > 0 ? dbInvLoans : 870000;
    const baseInvEquity = Math.max(0, baseInvVal - baseInvLoans);

    const baseSuper = dbSuper > 0 ? dbSuper : 650000;

    const computeAtYear = (t: number) => {
      const gH = homeGrowthRate / 100;
      const hVal = baseHomeVal * Math.pow(1 + gH, t);
      const hDebt = Math.max(0, baseHomeLoans - homeExtraRepayment * 12 * t);
      const hEquity = Math.max(0, hVal - hDebt);

      const gI = invGrowthRate / 100;
      const iVal =
        (baseInvVal + invAddlInvestment * (t / 25)) * Math.pow(1 + gI, t);
      const iDebt = Math.max(0, baseInvLoans - invExtraRepayment * 12 * t);
      const iEquity = Math.max(0, iVal - iDebt);

      const rS = superReturnRate / 100;
      const annualContrib = superExtraContrib * 12;
      const sBal =
        rS > 0
          ? baseSuper * Math.pow(1 + rS, t) +
            annualContrib * ((Math.pow(1 + rS, t) - 1) / rS)
          : baseSuper + annualContrib * t;

      return { t, hVal, hEquity, iVal, iEquity, sBal };
    };

    const atHorizon = computeAtYear(forecastHorizon);
    const projectedHomeVal = Math.round(atHorizon.hVal);
    const projectedInvEquity = Math.round(atHorizon.iEquity);
    const projectedAfterTaxIncome = Math.round(projectedInvEquity * 0.024888);
    const projectedSuperBal = Math.round(atHorizon.sBal);

    const projectIncomeTotal = Math.round(
      projectedInvEquity * 0.05 + projectedSuperBal * 0.045 + incomeGoal * 0.6
    );

    const years = [0, 5, 10, 15, 20, 25];
    const series = years.map((yr) => computeAtYear(yr));

    const maxVal = Math.max(
      6500000,
      Math.max(...series.map((d) => Math.max(d.hEquity, d.iEquity, d.sBal))) *
        1.08
    );
    const minVal = 0;

    const xForT = (t: number) =>
      15 + (Math.min(25, Math.max(0, t)) / 25) * 290;
    const yForVal = (val: number) => {
      const clamped = Math.max(minVal, Math.min(maxVal, val));
      return 135 - ((clamped - minVal) / (maxVal - minVal)) * 120;
    };

    const ptsHome = series.map((d) => ({
      x: xForT(d.t),
      y: yForVal(d.hEquity),
    }));
    const ptsInv = series.map((d) => ({
      x: xForT(d.t),
      y: yForVal(d.iEquity),
    }));
    const ptsSuper = series.map((d) => ({
      x: xForT(d.t),
      y: yForVal(d.sBal),
    }));

    const spline = (pts: { x: number; y: number }[]) => {
      if (pts.length === 0) return "";
      let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i === 0 ? 0 : i - 1];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];
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

    const markerX = xForT(forecastHorizon);
    const markerYHome = yForVal(atHorizon.hEquity);
    const markerYInv = yForVal(atHorizon.iEquity);
    const markerYSuper = yForVal(atHorizon.sBal);

    return {
      baseHomeEquity,
      baseInvEquity,
      baseSuper,
      projectedHomeVal,
      projectedInvEquity,
      projectedAfterTaxIncome,
      projectedSuperBal,
      projectIncomeTotal,
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
    };
  }, [
    propertiesList,
    dbHousehold,
    forecastHorizon,
    homeGrowthRate,
    homeExtraRepayment,
    invGrowthRate,
    invExtraRepayment,
    invAddlInvestment,
    superReturnRate,
    superExtraContrib,
    incomeGoal,
  ]);

  const filteredInsights =
    priorityFilter === "All"
      ? insights
      : insights.filter((item) => item.priority === priorityFilter);

  // Reusable Metric Card exactly matching Figma 1044:9390 (bg-[#f6f9fb] rounded-[12px] px-[20px] py-[15px])
  const renderMetricCard = (
    label: string,
    value: string,
    sub: string,
    iconSrc: string
  ) => (
    <div
      key={label}
      className="bg-[#f6f9fb] flex flex-col gap-[10px] items-start px-[20px] py-[15px] rounded-[12px] w-full"
    >
      <div className="flex gap-[18px] items-center w-full">
        <div className="bg-white border-[#dce4e8] border-[0.27px] border-solid drop-shadow-[0px_4px_2px_rgba(0,0,0,0.05)] flex items-center justify-center p-[5px] rounded-full shrink-0 size-[50px]">
          <img src={iconSrc} alt="" className="size-[24px] object-contain" />
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <p className="font-['Poppins',sans-serif] font-medium text-[#1a1c1e] text-[15px] sm:text-[16px] leading-snug truncate">
            {label}
          </p>
          <p className="font-['Poppins',sans-serif] font-extrabold text-[#0e2841] text-[14px] leading-normal mt-[6px]">
            {value}
          </p>
          <div className="w-[159px] max-w-full h-[1px] bg-[#dce4e8] my-[8px]" />
          <p className="font-['Poppins',sans-serif] font-normal text-[#1a1c1e] text-[13px] sm:text-[14px] leading-normal truncate">
            {sub}
          </p>
        </div>
      </div>
    </div>
  );

  // Exact Figma Wave Chart (from 1044:9552 using downloaded Figma SVGs) — Interactive on Hover
  const renderNetYieldChart = (title = "Net Yield History & Trend") => {
    const activeIdx =
      hoveredYieldPointIndex !== null ? hoveredYieldPointIndex : 4;
    const activePoint = NET_YIELD_POINTS[activeIdx] || NET_YIELD_POINTS[4];

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
      NET_YIELD_POINTS.forEach((pt, idx) => {
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
      <div className="bg-white flex flex-col gap-[13.6px] h-[267px] items-start overflow-hidden pl-[24px] pr-[20.44px] py-[20.44px] rounded-[8.176px] shadow-[0px_7.495px_12.264px_0px_rgba(0,0,0,0.04)] w-full">
        <div className="flex items-center justify-between w-full">
          <div className="flex flex-col gap-[4px] items-start">
            <p className="font-['Poppins',sans-serif] font-semibold leading-[1.4] text-[#0e2841] text-[10.5px] tracking-[-0.19px]">
              {title}
            </p>
            <p className="font-['Poppins',sans-serif] font-medium leading-[1.4] text-[#bcbcbc] text-[9.54px] tracking-[-0.19px]">
              Annual net operating yield after all property outgoings across
              financial years
            </p>
          </div>
          <div className="bg-white border-[#07315b] border-[0.821px] border-solid flex gap-[3.3px] items-center pl-[9.85px] pr-[6.57px] py-[6.57px] rounded-[6.569px] shadow-[0px_0.821px_1.642px_0px_rgba(10,13,20,0.03)] shrink-0 cursor-pointer">
            <span className="font-['Poppins',sans-serif] font-medium leading-[16.4px] text-[#0e2841] text-[11.5px] tracking-[-0.07px]">
              5 Years
            </span>
            <img
              src="/images/review/282b5.svg"
              alt=""
              className="size-[16.42px]"
            />
          </div>
        </div>

        {/* Wave + Grid Area using exact Figma coordinates (514x178) */}
        <div className="w-full overflow-x-auto">
          <div
            onMouseMove={handleWaveMouseMove}
            onMouseLeave={() => setHoveredYieldPointIndex(null)}
            className="relative flex flex-col gap-[8.08px] items-start w-[514px] h-[182px] cursor-crosshair"
          >
            <div className="flex gap-[9.7px] items-start">
              <div className="flex flex-col font-semibold gap-[18px] items-start leading-normal text-[#6b6b6b] text-[9.7px] tracking-[-0.194px] whitespace-nowrap select-none">
                <span>10%</span>
                <span>8%</span>
                <span>6%</span>
                <span>4%</span>
                <span>2%</span>
                <span>0%</span>
              </div>
              <div className="h-[156.923px] relative shrink-0 w-[462.795px]">
                <img
                  src="/images/review/80cb1.svg"
                  alt=""
                  className="absolute block inset-0 max-w-none size-full"
                />
              </div>
            </div>

            <div className="absolute h-[142.364px] left-[25.86px] top-[3.23px] w-[482.474px] pointer-events-none">
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
                className="absolute top-[6px] h-[148px] w-[1px] border-l border-dashed border-[#07315B]/40 pointer-events-none transition-all duration-150"
              />
            )}

            {/* Interactive SVG Dots along the wave matching b87d7.svg */}
            <div className="absolute h-[108.39px] left-[21.82px] top-[6.47px] w-[492.172px]">
              <svg
                width="492.172"
                height="108.39"
                viewBox="0 0 492.172 108.39"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="overflow-visible block size-full"
              >
                {NET_YIELD_POINTS.map((pt, idx) => {
                  const isActive = idx === activeIdx;
                  const isHovered = idx === hoveredYieldPointIndex;
                  return (
                    <g
                      key={pt.id}
                      onMouseEnter={() => setHoveredYieldPointIndex(idx)}
                      className="cursor-pointer"
                    >
                      {/* Invisible larger hit target for easy hover */}
                      <circle
                        cx={pt.cx}
                        cy={pt.cy}
                        r={16}
                        fill="transparent"
                      />
                      {/* Subtle outer halo when actively hovered */}
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
            <div className="absolute bottom-[4px] flex gap-[37.97px] items-start left-[19.4px] text-[#6b6b6b] text-[9.7px] font-semibold tracking-[-0.194px] whitespace-nowrap">
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
                className="absolute h-0 top-[16px] w-[13.74px] transition-all duration-150"
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
              className="absolute h-[38.652px] w-[88px] pointer-events-none transition-all duration-150 z-10"
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
                  top: isTooltipFlippedBelow ? "15.86px" : "8.21px",
                }}
                className="absolute bg-white flex h-[14.56px] items-center justify-center left-[12.5px] rounded-full w-[14.55px]"
              >
                <img
                  src="/images/review/0d7f6.svg"
                  alt=""
                  className={`size-[8.085px] transition-transform duration-150 ${
                    activePoint.trend === "down" ? "rotate-40" : "-rotate-40"
                  }`}
                />
              </div>
              <p
                style={{
                  top: isTooltipFlippedBelow ? "14.24px" : "6.59px",
                }}
                className="absolute font-semibold leading-[1.4] left-[31.9px] text-[11.319px] text-white tracking-[-0.2264px] whitespace-nowrap"
              >
                P: {activePoint.value}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Exact Figma 4-Bar Chart (from 1044:9607 using solid #0e2841 bars and 2-line labels below) — Interactive on Hover
  const renderBenchmarkBarChart = (title = "Benchmark comparison") => (
    <div className="bg-white flex flex-col gap-[8px] h-[267px] items-start justify-center px-[30px] py-[14px] rounded-[12px] shadow-[0px_11px_18px_0px_rgba(0,0,0,0.04)] w-full">
      <div className="flex items-center justify-between w-full">
        <div className="flex gap-[10px] h-[27px] items-center">
          <div className="bg-white drop-shadow-[0px_4px_2px_rgba(0,0,0,0.05)] flex items-start p-[5px] rounded-full">
            <img
              src="/images/review/ce848.svg"
              alt=""
              className="w-[16px] h-[15.5px]"
            />
          </div>
          <p className="font-['Poppins',sans-serif] font-semibold leading-[1.4] text-[#0e2841] text-[14px] tracking-[-0.28px]">
            {title}
          </p>
        </div>
      </div>

      <div className="flex gap-[24px] h-[210px] items-center justify-between w-full">
        {/* Y-Axis */}
        <div className="flex flex-col font-semibold gap-[14px] h-[192px] items-start leading-normal text-[#1a1c1e] text-[12px] tracking-[-0.24px] whitespace-nowrap select-none">
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
          {BENCHMARK_BARS.map((bar) => {
            const isHovered = hoveredBenchmarkBarId === bar.id;
            const isDimmed =
              hoveredBenchmarkBarId !== null &&
              hoveredBenchmarkBarId !== bar.id;
            return (
              <div
                key={bar.id}
                onMouseEnter={() => setHoveredBenchmarkBarId(bar.id)}
                className="relative flex flex-col gap-[9px] items-center cursor-pointer group"
              >
                {/* Floating Hover Tooltip */}
                {isHovered && (
                  <div className="absolute -top-[34px] left-1/2 -translate-x-1/2 bg-[#0e2841] text-white text-[10.5px] font-semibold px-2.5 py-1 rounded-[6px] shadow-md whitespace-nowrap z-20 pointer-events-none animate-in fade-in duration-150">
                    <span>
                      {bar.value} · {bar.diff}
                    </span>
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-[#0e2841]" />
                  </div>
                )}

                <div className="flex flex-col gap-[10px] items-center justify-center">
                  <span
                    className={`font-semibold text-[12px] tracking-[-0.24px] transition-colors duration-150 ${
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
                    style={{ height: `${bar.height}px` }}
                    className={`w-[45px] transition-all duration-150 ${
                      isHovered
                        ? "bg-[#1255ad] shadow-[0px_6px_14px_rgba(18,85,173,0.3)] -translate-y-0.5"
                        : isDimmed
                        ? "bg-[#0e2841]/55"
                        : "bg-[#0e2841]"
                    }`}
                  />
                </div>
                <div
                  className={`font-semibold text-[12px] text-center tracking-[-0.24px] leading-tight transition-colors duration-150 ${
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

  return (
    <div className="space-y-6 pb-12 font-['Poppins',sans-serif]">
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
            className="inline-flex items-center gap-[6px] text-[#434750] hover:text-[#0e2841] text-[15px] font-medium cursor-pointer mb-2"
          >
            <img
              src="/images/review/42c8e.svg"
              alt=""
              className="size-[20px]"
            />
            <span>
              {propertySubView === "cash-management"
                ? "Cash Management"
                : "Capital Management"}
            </span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-1">
            <div>
              <h1 className="font-['Poppins',sans-serif] font-semibold text-[#0e2841] text-[24px] tracking-[-0.64px] leading-[33px]">
                {propertySubView === "cash-management"
                  ? "Cash Flow & Operational Efficiency"
                  : "Capital & Debt Management:"}
              </h1>
              <p className="text-[13.5px] text-[#6b6b6b] mt-0.5">
                {propertySubView === "cash-management"
                  ? "Rental yields, operating cash flows, tax shields and holding cost breakdown."
                  : "Equity compound returns, mortgage leverage, rate hedging,"}
              </p>
            </div>

            <div className="bg-[rgba(246,231,179,0.39)] border-[#d79730] border-[0.5px] border-solid flex h-[30px] items-center justify-center px-[15px] rounded-[68px] shadow-[0px_4px_7.3px_0px_rgba(0,0,0,0.11)] shrink-0 w-[215px] gap-[10px]">
              <img
                src="/images/review/18912.svg"
                alt=""
                className="size-[16px]"
              />
              <span className="font-['Poppins',sans-serif] font-medium text-[#d79730] text-[12px] whitespace-nowrap">
                Status: Review In Progress
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div>
          {/* Top Link: < Back to Review Workspace (1044:9331) */}
          <button
            type="button"
            onClick={onBack}
            className="flex gap-[4px] items-center cursor-pointer text-[#434750] hover:text-[#0e2841] text-[16px] leading-[24px] font-['Poppins',sans-serif] font-normal transition-colors"
          >
            <img
              src="/images/review/42c8e.svg"
              alt=""
              className="size-[20px]"
            />
            <span>Back to Review Workspace</span>
          </button>

          {/* Title & Status Pill Row (1044:9335) — directly on page without card border */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-h-[72px] py-2">
            <h1 className="font-['Poppins',sans-serif] font-semibold text-[#0e2841] text-[22px] sm:text-[24px] leading-[33px] tracking-[-0.64px]">
              The Property Investor CFO Annual Report - {householdName}{" "}
              {reviewYear}
            </h1>

            <div className="bg-[rgba(246,231,179,0.39)] border-[#d79730] border-[0.5px] border-solid flex h-[30px] items-center justify-center px-[15px] rounded-[68px] shadow-[0px_4px_7.3px_0px_rgba(0,0,0,0.11)] shrink-0 w-[215px] gap-[10px]">
              <img
                src="/images/review/18912.svg"
                alt=""
                className="size-[16px]"
              />
              <span className="font-['Poppins',sans-serif] font-medium text-[#d79730] text-[12px] whitespace-nowrap">
                Status: Review In Progress
              </span>
            </div>
          </div>

          {/* 5 Main Views Tabs (1044:9348) — Solid navy active tab on #f2f1f2 background */}
          <div className="mt-2 bg-[#f2f1f2] inline-flex flex-wrap gap-[6px] min-h-[53px] items-center p-[6px] rounded-[8px]">
            {[
              { id: "executive-summary", label: "Executive Summary" },
              { id: "portfolio-overview", label: "Portfolio Overview" },
              { id: "property-analysis", label: "Property Analysis" },
              { id: "future-outlook", label: "Interactive Future Outlook" },
              {
                id: "insights",
                label: `Portfolio Management Insights (${insights.length || 3})`,
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
                  className={`py-[8px] text-[13.5px] tracking-[-0.28px] leading-[1.4] transition-all cursor-pointer whitespace-nowrap rounded-[4px] font-['Poppins',sans-serif] ${
                    isActive
                      ? "bg-[#0E2841] text-white px-[18px] font-medium shadow-xs"
                      : "bg-transparent px-[14px] font-medium text-[#7C8894] hover:text-[#0E2841]"
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
                  <button
                    type="button"
                    onClick={() => setIsEditingVerdict(!isEditingVerdict)}
                    className="p-1 text-[#6b6b6b] hover:text-[#0e2841] transition-colors cursor-pointer"
                    title="Edit Verdict"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
                {isEditingVerdict ? (
                  <textarea
                    rows={4}
                    value={verdictText}
                    onChange={(e) => setVerdictText(e.target.value)}
                    onBlur={() => {
                      setIsEditingVerdict(false);
                      persistReviewField({ verdictText });
                    }}
                    className="w-full bg-white border border-[#dce4e8] rounded-[8px] p-3 text-[13.5px] leading-[22px] text-[#1a1c1e] focus:outline-none focus:border-[#0e2841]"
                  />
                ) : (
                  <p className="text-[13.5px] leading-[22px] text-[#434750]">
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
                  <button
                    type="button"
                    onClick={() => setIsEditingObjective(!isEditingObjective)}
                    className="p-1 text-[#6b6b6b] hover:text-[#0e2841] transition-colors cursor-pointer"
                    title="Edit Objective"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
                {isEditingObjective ? (
                  <textarea
                    rows={4}
                    value={objectiveText}
                    onChange={(e) => setObjectiveText(e.target.value)}
                    onBlur={() => {
                      setIsEditingObjective(false);
                      persistReviewField({ objectiveText });
                    }}
                    className="w-full bg-white border border-[#dce4e8] rounded-[8px] p-3 text-[13.5px] leading-[22px] text-[#1a1c1e] focus:outline-none focus:border-[#0e2841]"
                  />
                ) : (
                  <p className="text-[13.5px] leading-[22px] text-[#434750]">
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
                <span className="text-[14px] font-medium text-[#6b6b6b]">
                  Portfolio Return Benchmarks
                </span>
                <span className="text-[40px] font-bold text-[#0e2841] leading-tight mt-1">
                  6.8%
                </span>
                <span className="text-[13px] text-[#6b6b6b] mt-0.5">
                  Total Return (FY2026)
                </span>
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
                      pct: "6.8% p.a.",
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
              {renderMetricCard(
                "Cash Return on Equity",
                "-2.9%",
                "12.4% vs FY2025",
                "/images/review/90cea.svg"
              )}
              {renderMetricCard(
                "After-Tax Cash Flow",
                "-$69,074",
                "12.4% vs FY2025",
                "/images/review/38829.svg"
              )}
              {renderMetricCard(
                "Cash Cover",
                "18.4 Months",
                "Buffer: $130,000",
                "/images/review/89393.svg"
              )}
              {renderMetricCard(
                "Average Interest Rate",
                "5.97%",
                "12.4% vs FY2025",
                "/images/review/61b85.svg"
              )}
            </div>

            {/* Commentary Box (899:8185) */}
            <div className="bg-[#f6f9fb] rounded-[12px] p-[22px]">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[16px] font-semibold text-[#0e2841]">
                  commentary
                </span>
                <Pencil className="w-3.5 h-3.5 text-[#6b6b6b]" />
              </div>
              <div className="bg-white border border-[#dce4e8] rounded-[8px] h-[56px] px-4 flex items-center justify-between">
                <input
                  type="text"
                  value={portfolioCommentary}
                  onChange={(e) => setPortfolioCommentary(e.target.value)}
                  placeholder="Add yours commentary here"
                  className="w-full text-[13.5px] text-[#1a1c1e] placeholder:text-[#a0a0a0] focus:outline-none bg-transparent"
                />
                <ChevronDown className="w-4 h-4 text-[#6b6b6b] shrink-0" />
              </div>
            </div>
          </div>

          {/* Card 3: Property Performance & Strategic Role (813:10209) */}
          <div className="bg-white rounded-[12px] p-[22px] shadow-[0px_11px_18px_0px_rgba(0,0,0,0.04)] space-y-6">
            <h3 className="text-[18px] font-bold text-[#0e2841] tracking-[-0.36px]">
              Property Performance &amp; Strategic Role
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="border-b border-[#F0F1F3] text-[12.5px] font-medium text-[#8C9BA8]">
                    <th className="py-3.5 px-3">
                      <div className="flex items-center gap-1">
                        <span>Property</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </div>
                    </th>
                    <th className="py-3.5 px-3">
                      <div className="flex items-center gap-1">
                        <span>Current Value</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </div>
                    </th>
                    <th className="py-3.5 px-3">
                      <div className="flex items-center gap-1">
                        <span>Net Yield</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </div>
                    </th>
                    <th className="py-3.5 px-3">
                      <div className="flex items-center gap-1">
                        <span>Total Return</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </div>
                    </th>
                    <th className="py-3.5 px-3">
                      <div className="flex items-center gap-1">
                        <span>After-Tax Cash Flow</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </div>
                    </th>
                    <th className="py-3.5 px-3">
                      <div className="flex items-center gap-1">
                        <span>Strategic Role</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F6F7F9] text-[13.5px] text-[#1A1C1E]">
                  {propertiesList.map((prop) => (
                    <tr
                      key={prop.id}
                      className="hover:bg-[#FBFBFC] transition-colors"
                    >
                      <td className="py-4 px-3 font-medium">{prop.address}</td>
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
                        {prop.isOwnerOccupied
                          ? "Primary Residence"
                          : "Core Growth & Yield"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Commentary Box (899:8199) */}
            <div className="bg-[#f6f9fb] rounded-[12px] p-[22px]">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[16px] font-semibold text-[#0e2841]">
                  commentary
                </span>
                <Pencil className="w-3.5 h-3.5 text-[#6b6b6b]" />
              </div>
              <div className="bg-white border border-[#dce4e8] rounded-[8px] h-[56px] px-4 flex items-center justify-between">
                <input
                  type="text"
                  value={propertyCommentary}
                  onChange={(e) => setPropertyCommentary(e.target.value)}
                  placeholder="Add yours commentary here"
                  className="w-full text-[13.5px] text-[#1a1c1e] placeholder:text-[#a0a0a0] focus:outline-none bg-transparent"
                />
                <ChevronDown className="w-4 h-4 text-[#6b6b6b] shrink-0" />
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
                <h3 className="text-[17px] font-semibold text-[#0e2841] pb-4 border-b border-[#dce4e8]">
                  Three Biggest Portfolio Opportunities
                </h3>
                <div className="divide-y divide-[#dce4e8]">
                  {[
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
                  ].map((opp) => (
                    <div key={opp.title} className="py-4 first:pt-4 last:pb-1">
                      <p className="text-[14.5px] font-semibold text-[#0e2841]">
                        {opp.title}
                      </p>
                      <p className="text-[12.5px] text-[#6b6b6b] mt-1">
                        {opp.desc}
                      </p>
                      <p className="text-[14.5px] font-bold text-[#15803D] mt-1.5">
                        {opp.amount}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Key Risks to Manage */}
              <div className="bg-[#f6f9fb] rounded-[12px] p-[20px]">
                <h3 className="text-[17px] font-semibold text-[#0e2841] pb-4 border-b border-[#dce4e8]">
                  Key Risks to Manage
                </h3>
                <div className="divide-y divide-[#dce4e8]">
                  {[
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
                  ].map((risk) => (
                    <div
                      key={risk.title}
                      className="py-4 first:pt-4 last:pb-1 flex items-start gap-3.5"
                    >
                      <div className="w-[40px] h-[40px] rounded-full bg-white border border-[#dce4e8] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                        <Clock className="w-5 h-5 text-[#0e2841]" />
                      </div>
                      <div>
                        <p className="text-[14.5px] font-semibold text-[#0e2841]">
                          {risk.title}
                        </p>
                        <p className="text-[12.5px] text-[#6b6b6b] mt-1 leading-relaxed">
                          {risk.desc}
                        </p>
                      </div>
                    </div>
                  ))}
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
                  </div>
                  <div className="bg-[#0e2841] text-white h-[40px] px-[21px] rounded-[8px] text-[13.5px] font-medium flex items-center">
                    Goal: $120,000 p.a.
                  </div>
                </div>

                {/* Current path */}
                <div
                  onMouseEnter={() => setHoveredTrackPath("current")}
                  onMouseLeave={() => setHoveredTrackPath(null)}
                  className="relative py-5 border-b border-[#dce4e8] cursor-pointer"
                >
                  {hoveredTrackPath === "current" && (
                    <div className="absolute top-1 left-[50%] -translate-x-1/2 bg-[#0e2841] text-white text-[11px] font-semibold px-3 py-1 rounded-[6px] shadow-md whitespace-nowrap z-20 pointer-events-none">
                      93.3% of $120,000 goal (-$8,000 p.a. shortfall)
                    </div>
                  )}
                  <div className="flex items-center justify-between max-w-[509px] text-[13px] mb-2.5">
                    <span className="text-[#434750] font-medium">
                      Current path:
                    </span>
                    <span className="font-bold text-[#0e2841]">$112,000</span>
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
                      110.0% of $120,000 goal (+$12,000 p.a. surplus)
                    </div>
                  )}
                  <div className="flex items-center justify-between max-w-[663px] text-[13px] mb-2.5">
                    <span className="text-[#434750] font-medium">
                      With key actions:
                    </span>
                    <span className="font-bold text-[#15803D]">$132,000</span>
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
                <p className="text-[13.5px] leading-[22px] text-[#434750] pt-4">
                  With the identified actions, your portfolio could provide
                  around $132,000 p.a. in 20 years, above your $120,000
                  target.&quot;
                </p>
              </div>
            </div>
          </div>

          {/* Card 6: Three Priority Initiatives (791:9276) */}
          <div className="bg-white rounded-[12px] p-[26px] shadow-[0px_11px_18px_0px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-2 mb-6">
              <h3 className="text-[18px] font-bold text-[#0e2841]">
                Three Priority Initiatives
              </h3>
              <Pencil className="w-4 h-4 text-[#6b6b6b]" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-[16px]">
              {[
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
              ].map((item) => (
                <div
                  key={item.title}
                  className="bg-[#f6f9fb] rounded-[10px] p-[20px]"
                >
                  <p className="text-[14.5px] font-semibold text-[#0e2841]">
                    {item.title}
                  </p>
                  <p className="text-[13px] text-[#6b6b6b] mt-2 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Card 7: THE BOTTOM LINE (791:9442) */}
          <div className="bg-white rounded-[12px] p-[26px] shadow-[0px_11px_18px_0px_rgba(0,0,0,0.04)]">
            <h3 className="text-[18px] font-bold text-[#0e2841] mb-4">
              THE BOTTOM LINE
            </h3>
            <div className="bg-[#f6f9fb] border border-[#dce4e8] rounded-[8px] h-[61px] px-4 flex items-center justify-between">
              <input
                type="text"
                value={bottomLineText}
                onChange={(e) => setBottomLineText(e.target.value)}
                className="w-full text-[13.5px] text-[#1a1c1e] focus:outline-none bg-transparent"
              />
              <ChevronDown className="w-4 h-4 text-[#6b6b6b] shrink-0" />
            </div>
          </div>
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

            <button
              type="button"
              onClick={() => setIsAddInsightOpen(true)}
              className="bg-[#0e2841] hover:bg-[#163859] text-white h-[40px] w-[177px] rounded-[8px] text-[14px] font-medium flex items-center justify-center transition-colors cursor-pointer"
            >
              + Add Insight
            </button>
          </div>

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
                "/images/review/90cea.svg"
              )}
              {renderMetricCard(
                "Total Loans",
                fmtMoney(portfolioStats.invLoans),
                "Investment Debt",
                "/images/review/89393.svg"
              )}
              {renderMetricCard(
                "Total Equity",
                fmtMoney(portfolioStats.invEquity),
                "Net Investment Equity",
                "/images/review/38829.svg"
              )}
              {renderMetricCard(
                "LVR",
                `${portfolioStats.invLvr.toFixed(2)}%`,
                "Loan-to-Value Ratio",
                "/images/review/30184.svg"
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
              {/* Second underlined < Back to Review Workspace link (1044:9717) */}
              <button
                type="button"
                onClick={onBack}
                className="flex gap-[4px] items-center cursor-pointer pt-1"
              >
                <img
                  src="/images/review/74f5d.svg"
                  alt=""
                  className="size-[20px]"
                />
                <span className="font-['Inter',sans-serif] font-medium text-[#1a1c1e] text-[14px] leading-[20px] tracking-[-0.084px] underline">
                  Back to Review Workspace
                </span>
              </button>

              {/* Property Overview Card (1044:9657) */}
              <div className="bg-white rounded-[12px] shadow-[0px_11px_18px_0px_rgba(0,0,0,0.04)] px-[28px] py-[18px]">
                <p className="font-['Poppins',sans-serif] font-bold text-[#0e2841] text-[18px] tracking-[-0.36px] capitalize mb-2">
                  Property Overview
                </p>

                <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
                  {/* Left: 88x88 Image + Address + Features */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-[16px]">
                    <div className="border-t-[0.82px] border-[rgba(122,116,116,0.1)] pt-1 shrink-0">
                      <div className="relative rounded-[1px] shrink-0 size-[88px] overflow-hidden">
                        <img
                          src={currentProperty.image}
                          alt={currentProperty.address}
                          className="absolute h-[126.42%] left-[-0.46%] max-w-none top-[-24.53%] w-[100.93%]"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-[8px]">
                      {/* Address + Light Blue Pill + Square Dropdown Button */}
                      <div className="flex flex-wrap items-center gap-[9px] relative">
                        <p className="font-['Poppins',sans-serif] font-bold text-[#0e2841] text-[18px] tracking-[-0.36px]">
                          {currentProperty.address}
                        </p>

                        <div className="bg-[rgba(56,125,215,0.06)] border border-[#1255ad] border-solid flex h-[29px] items-center justify-center px-[15px] rounded-[68px]">
                          <span className="font-['Poppins',sans-serif] font-semibold text-[#1255ad] text-[12px] whitespace-nowrap">
                            {currentProperty.badge}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setIsPropertyDropdownOpen(!isPropertyDropdownOpen)
                          }
                          className="bg-white border border-[#ebebeb] flex h-[33px] w-[36px] items-center justify-center rounded-[10px] shadow-[0px_1px_2px_0px_rgba(10,13,20,0.03)] cursor-pointer hover:bg-gray-50 transition-colors"
                          title="Switch Property"
                        >
                          <img
                            src="/images/review/5d15e.svg"
                            alt=""
                            className="w-[14px] h-[7px]"
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
                      <p className="font-['Poppins',sans-serif] font-semibold text-[#1a1c1e] text-[12px] tracking-[-0.24px]">
                        {currentProperty.subtitle}
                      </p>

                      {/* 4 Feature Columns (Icon + Number on top, Label below) */}
                      <div className="flex flex-wrap items-center gap-[36px] mt-0.5">
                        <div className="flex flex-col gap-[4px] items-start">
                          <div className="flex gap-[6.5px] items-center">
                            <img
                              src="/images/review/f4098.svg"
                              alt=""
                              className="size-[19.68px]"
                            />
                            <span className="font-['Inter',sans-serif] font-medium text-[#1a1c1e] text-[13.12px]">
                              {currentProperty.beds}
                            </span>
                          </div>
                          <span className="font-medium text-[#1a1c1e] text-[11.48px]">
                            Bedrooms
                          </span>
                        </div>

                        <div className="flex flex-col gap-[4px] items-start">
                          <div className="flex gap-[6.5px] items-center">
                            <img
                              src="/images/review/70fd5.svg"
                              alt=""
                              className="size-[19.68px]"
                            />
                            <span className="font-['Inter',sans-serif] font-medium text-[#1a1c1e] text-[13.12px]">
                              {currentProperty.baths}
                            </span>
                          </div>
                          <span className="font-medium text-[#1a1c1e] text-[11.48px]">
                            Bathrooms
                          </span>
                        </div>

                        <div className="flex flex-col gap-[4px] items-start">
                          <div className="flex gap-[6.5px] items-center">
                            <img
                              src="/images/review/08785.svg"
                              alt=""
                              className="size-[19.68px]"
                            />
                            <span className="font-['Inter',sans-serif] font-medium text-[#1a1c1e] text-[13.12px]">
                              {currentProperty.area}
                            </span>
                          </div>
                          <span className="font-medium text-[#1a1c1e] text-[11.48px]">
                            Total area
                          </span>
                        </div>

                        <div className="flex flex-col gap-[4px] items-start">
                          <div className="flex gap-[6.5px] items-center">
                            <img
                              src="/images/review/a544d.svg"
                              alt=""
                              className="size-[19.68px]"
                            />
                            <span className="font-['Inter',sans-serif] font-medium text-[#1a1c1e] text-[13.12px]">
                              {currentProperty.garages}
                            </span>
                          </div>
                          <span className="font-medium text-[#1a1c1e] text-[11.48px]">
                            Garages
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Purchase Details & Ownership (1044:9713) */}
                  <div className="flex items-center justify-end gap-[48px] sm:gap-[62px]">
                    <div className="font-medium leading-[20px] text-[#1a1c1e] text-[14px] text-right whitespace-nowrap">
                      <p>Purchase Details:</p>
                      <p>Price: {currentProperty.purchasePrice}</p>
                      <p>Purchase Date: {currentProperty.purchaseDate}</p>
                    </div>

                    <div className="h-[56px] w-[1px] bg-[#1a1c1e]/20 shrink-0" />

                    <div className="font-medium leading-[20px] text-[#1a1c1e] text-[14px] text-right whitespace-nowrap">
                      <p>Ownership:</p>
                      {currentProperty.owners.map((line) => (
                        <p key={line}>{line}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Portfolio Summary (Balance Sheet) — Section Title + 5 #f6f9fb Cards directly on page (1044:9376) */}
              <div className="pt-2">
                <p className="font-['Poppins',sans-serif] font-medium leading-[1.4] text-[#0e2841] text-[16px] tracking-[-0.32px] mb-3">
                  Portfolio Summary (Balance Sheet)
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-[14px]">
                  {renderMetricCard(
                    "Property Value",
                    currentProperty.propertyValue,
                    "12.4% vs FY2025",
                    "/images/review/90cea.svg"
                  )}
                  {renderMetricCard(
                    "Total Loans",
                    currentProperty.totalLoans,
                    "12.4% vs FY2025",
                    "/images/review/89393.svg"
                  )}
                  {renderMetricCard(
                    "Total Equity",
                    currentProperty.totalEquity,
                    "12.4% vs FY2025",
                    "/images/review/38829.svg"
                  )}
                  {renderMetricCard(
                    "Total Property Return",
                    currentProperty.totalReturn,
                    "12.4% vs FY2025",
                    "/images/review/61b85.svg"
                  )}
                  {renderMetricCard(
                    "LVR (Loan-to-Value Ratio)",
                    currentProperty.lvr,
                    "12.4% vs FY2025",
                    "/images/review/30184.svg"
                  )}
                </div>
              </div>

              {/* Bottom 2 Charts (1044:9551) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-[24px] pt-2">
                {renderNetYieldChart("Net Yield History & Trend")}
                {renderBenchmarkBarChart("Benchmark comparison")}
              </div>

              {/* Bottom-Right 3 Dark Navy Action Buttons (1044:9650) */}
              <div className="flex flex-wrap items-center justify-end gap-[13px] pt-3">
                <button
                  type="button"
                  onClick={() => setPropertySubView("cash-management")}
                  className="bg-[#0e2841] hover:bg-[#163859] text-white h-[48px] w-[177px] rounded-[8px] text-[14px] font-['Poppins',sans-serif] font-medium flex items-center justify-center transition-colors cursor-pointer"
                >
                  Cash Management
                </button>
                <button
                  type="button"
                  onClick={() => setPropertySubView("capital-management")}
                  className="bg-[#0e2841] hover:bg-[#163859] text-white h-[48px] w-[177px] rounded-[8px] text-[14px] font-['Poppins',sans-serif] font-medium flex items-center justify-center transition-colors cursor-pointer"
                >
                  Capital Management
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddInsightOpen(true)}
                  className="bg-[#0e2841] hover:bg-[#163859] text-white h-[48px] w-[177px] rounded-[8px] text-[14px] font-['Poppins',sans-serif] font-medium flex items-center justify-center transition-colors cursor-pointer"
                >
                  + Add Insight
                </button>
              </div>
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
                <button
                  type="button"
                  onClick={() => setIsAddInsightOpen(true)}
                  className="bg-[#0e2841] hover:bg-[#163859] text-white h-[40px] w-[177px] rounded-[8px] text-[14px] font-medium flex items-center justify-center transition-colors cursor-pointer"
                >
                  + Add Insight
                </button>
              </div>
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
                <button
                  type="button"
                  onClick={() => setIsAddInsightOpen(true)}
                  className="bg-[#0e2841] hover:bg-[#163859] text-white h-[40px] w-[177px] rounded-[8px] text-[14px] font-medium flex items-center justify-center transition-colors cursor-pointer"
                >
                  + Add Insight
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 4: INTERACTIVE FUTURE OUTLOOK (Figma 1106:11400)              */}
      {/* ================================================================= */}
      {activeTab === "future-outlook" && (
        <div className="space-y-7 pt-2 font-['Inter',sans-serif]">
          {/* Section 1: Current Household Financial Position (FY2026 Baseline) */}
          <div>
            <h2 className="font-['Poppins',sans-serif] text-[18px] font-bold text-[#0E2841]">
              Current Household Financial Position (FY2026 Baseline)
            </h2>
            <p className="font-['Poppins',sans-serif] text-[13.5px] font-medium text-[#64748B] mt-1 mb-5">
              Forecast Period &amp; Projection Horizon
            </p>

            {/* Two Columns Grid: Left 3 Assumption Cards, Right Project Income Card */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              {/* Left Column: 3 Assumption Cards */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                {/* Card 1: Home Assumptions */}
                <div className="bg-[#F0F5FA] rounded-[14px] p-5 border border-[#E2E8F0]/50 flex flex-col justify-between">
                  <div className="flex items-center justify-between pb-3">
                    <h3 className="font-['Poppins',sans-serif] text-[16px] font-bold text-[#0E2841]">
                      Home Assumptions
                    </h3>
                    <div className="bg-[#0E2841] rounded-[6px] px-3.5 py-1.5 text-right shrink-0">
                      <span className="block text-[10px] font-medium text-white/80 leading-tight">
                        Equity FY 2026
                      </span>
                      <span className="block text-[14px] font-bold text-[#FBBF24] leading-tight">
                        {fmtMoney(futureOutlookData.baseHomeEquity)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                    {/* Slider 1: Home Value Growth */}
                    <div>
                      <div className="flex items-center justify-between text-[12px] font-semibold text-[#0E2841] mb-1">
                        <span>Home Value Growth</span>
                      </div>
                      <div className="text-[12px] font-bold text-[#0E2841] mb-1.5">
                        {homeGrowthRate.toFixed(1)}%
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="10.0"
                        step="0.1"
                        value={homeGrowthRate}
                        onChange={(e) =>
                          setHomeGrowthRate(Number(e.target.value))
                        }
                        className="w-full h-1.5 bg-[#CBD5E1] rounded-lg appearance-none cursor-pointer accent-[#0E2841]"
                      />
                    </div>

                    {/* Slider 2: Extra Loan Repayments */}
                    <div>
                      <div className="flex items-center justify-between text-[12px] font-semibold text-[#0E2841] mb-1">
                        <span>Extra Loan Repayments</span>
                      </div>
                      <div className="text-[12px] font-bold text-[#0E2841] mb-1.5">
                        {fmtMoney(homeExtraRepayment)}
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="4000"
                        step="50"
                        value={homeExtraRepayment}
                        onChange={(e) =>
                          setHomeExtraRepayment(Number(e.target.value))
                        }
                        className="w-full h-1.5 bg-[#CBD5E1] rounded-lg appearance-none cursor-pointer accent-[#0E2841]"
                      />
                    </div>

                    {/* Slider 3: Downsizer Price Today */}
                    <div>
                      <div className="flex items-center justify-between text-[12px] font-semibold text-[#0E2841] mb-1">
                        <span>Downsizer Price Today</span>
                      </div>
                      <div className="text-[12px] font-bold text-[#0E2841] mb-1.5">
                        {fmtMoney(homeDownsizerPrice)}
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1000"
                        step="25"
                        value={homeDownsizerPrice}
                        onChange={(e) =>
                          setHomeDownsizerPrice(Number(e.target.value))
                        }
                        className="w-full h-1.5 bg-[#CBD5E1] rounded-lg appearance-none cursor-pointer accent-[#0E2841]"
                      />
                    </div>
                  </div>
                </div>

                {/* Card 2: Investment Properties */}
                <div className="bg-[#FFF9F2] rounded-[14px] p-5 border border-[#FDE8B5]/50 flex flex-col justify-between">
                  <div className="flex items-center justify-between pb-3">
                    <h3 className="font-['Poppins',sans-serif] text-[16px] font-bold text-[#0E2841]">
                      Investment Properties
                    </h3>
                    <div className="bg-[#E59740] rounded-[6px] px-3.5 py-1.5 text-right shrink-0">
                      <span className="block text-[10px] font-medium text-white/90 leading-tight">
                        Net Equity FY 2026
                      </span>
                      <span className="block text-[14px] font-bold text-white leading-tight">
                        {fmtMoney(futureOutlookData.baseInvEquity)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                    {/* Slider 1: Property Growth (CAGR) */}
                    <div>
                      <div className="flex items-center justify-between text-[12px] font-semibold text-[#0E2841] mb-1">
                        <span>Property Growth (CAGR)</span>
                      </div>
                      <div className="text-[12px] font-bold text-[#0E2841] mb-1.5">
                        {invGrowthRate.toFixed(1)}%
                      </div>
                      <input
                        type="range"
                        min="1.0"
                        max="12.0"
                        step="0.1"
                        value={invGrowthRate}
                        onChange={(e) =>
                          setInvGrowthRate(Number(e.target.value))
                        }
                        className="w-full h-1.5 bg-[#CBD5E1] rounded-lg appearance-none cursor-pointer accent-[#0E2841]"
                      />
                    </div>

                    {/* Slider 2: Extra Loan Repayments */}
                    <div>
                      <div className="flex items-center justify-between text-[12px] font-semibold text-[#0E2841] mb-1">
                        <span>Extra Loan Repayments</span>
                      </div>
                      <div className="text-[12px] font-bold text-[#0E2841] mb-1.5">
                        {fmtMoney(invExtraRepayment)}
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="5000"
                        step="50"
                        value={invExtraRepayment}
                        onChange={(e) =>
                          setInvExtraRepayment(Number(e.target.value))
                        }
                        className="w-full h-1.5 bg-[#CBD5E1] rounded-lg appearance-none cursor-pointer accent-[#0E2841]"
                      />
                    </div>

                    {/* Slider 3: Additional Investment */}
                    <div>
                      <div className="flex items-center justify-between text-[12px] font-semibold text-[#0E2841] mb-1">
                        <span>Additional Investment</span>
                      </div>
                      <div className="text-[12px] font-bold text-[#0E2841] mb-1.5">
                        {invAddlInvestment === 0
                          ? "None"
                          : fmtMoney(invAddlInvestment)}
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="300000"
                        step="10000"
                        value={invAddlInvestment}
                        onChange={(e) =>
                          setInvAddlInvestment(Number(e.target.value))
                        }
                        className="w-full h-1.5 bg-[#CBD5E1] rounded-lg appearance-none cursor-pointer accent-[#0E2841]"
                      />
                    </div>
                  </div>
                </div>

                {/* Card 3: Superannuation */}
                <div className="bg-[#F3EFFD] rounded-[14px] p-5 border border-[#DDD6FE]/50 flex flex-col justify-between">
                  <div className="flex items-center justify-between pb-3">
                    <h3 className="font-['Poppins',sans-serif] text-[16px] font-bold text-[#0E2841]">
                      Superannuation
                    </h3>
                    <div className="bg-[#8F75DA] rounded-[6px] px-3.5 py-1.5 text-right shrink-0">
                      <span className="block text-[10px] font-medium text-white/90 leading-tight">
                        Projected Balance
                      </span>
                      <span className="block text-[14px] font-bold text-white leading-tight">
                        {fmtMoney(futureOutlookData.baseSuper)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                    {/* Slider 1: Return p.a */}
                    <div>
                      <div className="flex items-center justify-between text-[12px] font-semibold text-[#0E2841] mb-1">
                        <span>Return p.a</span>
                      </div>
                      <div className="text-[12px] font-bold text-[#0E2841] mb-1.5">
                        {superReturnRate.toFixed(1)}%
                      </div>
                      <input
                        type="range"
                        min="1.0"
                        max="12.0"
                        step="0.1"
                        value={superReturnRate}
                        onChange={(e) =>
                          setSuperReturnRate(Number(e.target.value))
                        }
                        className="w-full h-1.5 bg-[#CBD5E1] rounded-lg appearance-none cursor-pointer accent-[#0E2841]"
                      />
                    </div>

                    {/* Slider 2: Extra Contribution */}
                    <div>
                      <div className="flex items-center justify-between text-[12px] font-semibold text-[#0E2841] mb-1">
                        <span>Extra Contribution</span>
                      </div>
                      <div className="text-[12px] font-bold text-[#0E2841] mb-1.5">
                        {fmtMoney(superExtraContrib)}
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="5000"
                        step="50"
                        value={superExtraContrib}
                        onChange={(e) =>
                          setSuperExtraContrib(Number(e.target.value))
                        }
                        className="w-full h-1.5 bg-[#CBD5E1] rounded-lg appearance-none cursor-pointer accent-[#0E2841]"
                      />
                    </div>

                    <div className="hidden sm:block" />
                  </div>
                </div>
              </div>

              {/* Right Column: Project Income Dark Navy Card */}
              <div className="lg:col-span-5 bg-[#072444] rounded-[16px] p-5 text-white flex flex-col justify-between shadow-sm">
                <div>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h3 className="font-['Poppins',sans-serif] text-[17px] font-bold text-white">
                      Project Income
                    </h3>
                    <div className="bg-white rounded-[6px] px-3 py-1 shrink-0 shadow-xs">
                      <span className="font-['Poppins',sans-serif] text-[14.5px] font-bold text-[#D97706]">
                        ${futureOutlookData.projectIncomeTotal.toLocaleString("en-AU")}.00
                      </span>
                    </div>
                  </div>

                  {/* Inner White Card for Multi-Line Chart */}
                  <div className="bg-white rounded-[12px] p-3.5 text-[#0E2841]">
                    {/* Legend */}
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 mb-2 text-[10px] font-medium text-[#475569]">
                      <div className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-[#0E2841]" />
                        <span>Home Equity</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-[#E59740]" />
                        <span>Investment net equity</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-[#EC4899]" />
                        <span>Super Balance</span>
                      </div>
                    </div>

                    {/* Interactive Tooltip Bar when hovered */}
                    <div className="min-h-[18px] mb-1 flex items-center justify-center">
                      {chartHoverYear !== null ? (
                        <div className="text-[10px] font-medium text-[#0E2841] bg-[#F1F5F9] px-2 py-0.5 rounded-full inline-flex items-center gap-2">
                          <span className="font-bold">
                            {2026 + chartHoverYear} ({chartHoverYear} yrs):
                          </span>
                          <span className="text-[#0E2841]">
                            Home: {fmtMoney(futureOutlookData.computeAtYear(chartHoverYear).hEquity)}
                          </span>
                          <span className="text-[#E59740]">
                            Inv: {fmtMoney(futureOutlookData.computeAtYear(chartHoverYear).iEquity)}
                          </span>
                          <span className="text-[#EC4899]">
                            Super: {fmtMoney(futureOutlookData.computeAtYear(chartHoverYear).sBal)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[9.5px] text-[#94A3B8]">
                          Hover over graph to view projected values by year
                        </span>
                      )}
                    </div>

                    {/* SVG Multi-Line Chart */}
                    <div className="relative w-full h-[175px]">
                      <svg
                        viewBox="0 0 320 150"
                        className="w-full h-full overflow-visible cursor-crosshair"
                        preserveAspectRatio="none"
                        onMouseMove={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const relX = (e.clientX - rect.left) / rect.width;
                          const yr = Math.round(Math.min(25, Math.max(0, relX * 25)));
                          setChartHoverYear(yr);
                        }}
                        onMouseLeave={() => setChartHoverYear(null)}
                      >
                        {/* Horizontal reference lines */}
                        <line
                          x1="0"
                          y1="30"
                          x2="320"
                          y2="30"
                          stroke="#F1F5F9"
                          strokeWidth="1"
                        />
                        <line
                          x1="0"
                          y1="75"
                          x2="320"
                          y2="75"
                          stroke="#F1F5F9"
                          strokeWidth="1"
                        />
                        <line
                          x1="0"
                          y1="120"
                          x2="320"
                          y2="120"
                          stroke="#F1F5F9"
                          strokeWidth="1"
                        />

                        {/* Interactive Hover guideline if active */}
                        {chartHoverYear !== null && (
                          <line
                            x1={futureOutlookData.xForT(chartHoverYear)}
                            y1={10}
                            x2={futureOutlookData.xForT(chartHoverYear)}
                            y2={135}
                            stroke="#CBD5E1"
                            strokeWidth="1"
                            strokeDasharray="2 2"
                          />
                        )}

                        {/* Vertical reference dashed line at selected Retirement Horizon */}
                        <line
                          x1={futureOutlookData.markerX}
                          y1={10}
                          x2={futureOutlookData.markerX}
                          y2={135}
                          stroke="#94A3B8"
                          strokeWidth="1.2"
                          strokeDasharray="3 3"
                          className="transition-all duration-200"
                        />

                        {/* Curve 1: Home Equity (Navy `#0E2841`) */}
                        <path
                          d={futureOutlookData.pathHome}
                          fill="none"
                          stroke="#0E2841"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          className="transition-all duration-200"
                        />
                        <circle
                          cx={futureOutlookData.markerX}
                          cy={futureOutlookData.markerYHome}
                          r={4}
                          fill="#0E2841"
                          stroke="#FFFFFF"
                          strokeWidth="1.5"
                          className="transition-all duration-200"
                        />

                        {/* Curve 2: Investment Net Equity (Amber `#E59740`) */}
                        <path
                          d={futureOutlookData.pathInv}
                          fill="none"
                          stroke="#E59740"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          className="transition-all duration-200"
                        />
                        <circle
                          cx={futureOutlookData.markerX}
                          cy={futureOutlookData.markerYInv}
                          r={4}
                          fill="#E59740"
                          stroke="#FFFFFF"
                          strokeWidth="1.5"
                          className="transition-all duration-200"
                        />

                        {/* Curve 3: Super Balance (Magenta `#EC4899`) */}
                        <path
                          d={futureOutlookData.pathSuper}
                          fill="none"
                          stroke="#EC4899"
                          strokeWidth="2"
                          strokeLinecap="round"
                          className="transition-all duration-200"
                        />
                        <circle
                          cx={futureOutlookData.markerX}
                          cy={futureOutlookData.markerYSuper}
                          r={4}
                          fill="#EC4899"
                          stroke="#FFFFFF"
                          strokeWidth="1.5"
                          className="transition-all duration-200"
                        />
                      </svg>

                      {/* X-axis Labels */}
                      <div className="flex items-center justify-between text-[9.5px] font-medium text-[#94A3B8] pt-1 border-t border-[#F1F5F9]">
                        <span>Today</span>
                        <span>10 years</span>
                        <span>15 years</span>
                        <span>20 years</span>
                        <span>25 years</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Sliders inside Dark Navy Card */}
                <div className="space-y-3.5 pt-4">
                  {/* Slider 1: Years Until Retirement */}
                  <div>
                    <div className="flex items-center justify-between text-[12.5px] font-medium text-white/90 mb-1">
                      <span>Years Until Retirement</span>
                      <span className="font-semibold text-white">
                        {forecastHorizon}Years
                      </span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="35"
                      step="1"
                      value={forecastHorizon}
                      onChange={(e) =>
                        setForecastHorizon(Number(e.target.value))
                      }
                      className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#38BDF8]"
                    />
                  </div>

                  {/* Slider 2: Income Goal (P.a) */}
                  <div>
                    <div className="flex items-center justify-between text-[12.5px] font-medium text-white/90 mb-1">
                      <span>Income Goal (P.a)</span>
                      <span className="font-semibold text-white">
                        {fmtMoney(incomeGoal)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="20000"
                      max="200000"
                      step="5000"
                      value={incomeGoal}
                      onChange={(e) => setIncomeGoal(Number(e.target.value))}
                      className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#38BDF8]"
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
                <button
                  type="button"
                  onClick={() => setIsAddInsightOpen(true)}
                  className="bg-[#0E2841] hover:bg-[#163859] text-white px-4 py-2 rounded-[6px] text-[13px] font-medium transition-colors cursor-pointer"
                >
                  + Add Insight
                </button>
              </div>
            </div>

            {/* 3 Outcome Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: Home — Owner Occupied */}
              <div className="bg-[#F0F5FA] rounded-[16px] p-6 border border-[#E2E8F0]/40 relative min-h-[260px] flex flex-col justify-between overflow-hidden">
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
                    <p className="text-[12.5px] font-medium text-[#64748B]">
                      Projected Home Value
                    </p>
                    <p className="text-[22px] font-bold text-[#0E2841] mt-0.5 mb-2.5">
                      {fmtMoney(futureOutlookData.projectedHomeVal)}
                    </p>
                    <p className="text-[11.5px] text-[#64748B] leading-relaxed max-w-[210px]">
                      Note: Owner-occupied home is not included in investment
                      income where applicable.
                    </p>
                  </div>
                </div>

                <img
                  src="/images/future-outlook/house.png"
                  alt="Home"
                  className="w-[120px] h-auto object-contain absolute bottom-3 right-3 pointer-events-none"
                />
              </div>

              {/* Card 2: Investment Properties */}
              <div className="bg-[#FFF9F2] rounded-[16px] p-6 border border-[#FDE8B5]/40 relative min-h-[260px] flex flex-col justify-between overflow-hidden">
                <div>
                  <div className="flex items-center justify-between pb-3.5 border-b border-[#FDE8B5]/60">
                    <h3 className="font-['Poppins',sans-serif] text-[16px] font-bold text-[#0E2841]">
                      Investment Properties
                    </h3>
                    <span className="text-[13px] font-medium text-[#64748B]">
                      {targetYear}
                    </span>
                  </div>

                  <div className="mt-4">
                    <p className="text-[12.5px] font-medium text-[#64748B]">
                      Projected After-Tax Income
                    </p>
                    <p className="text-[22px] font-bold text-[#0E2841] mt-0.5 mb-2.5">
                      {fmtMoney(futureOutlookData.projectedAfterTaxIncome)}
                      <span className="text-[14px] font-normal text-[#64748B]">
                        {" "}
                        / yr
                      </span>
                    </p>

                    <p className="text-[12.5px] font-medium text-[#64748B]">
                      Projected Net Equity
                    </p>
                    <p className="text-[22px] font-bold text-[#0E2841] mt-0.5">
                      {fmtMoney(futureOutlookData.projectedInvEquity)}
                    </p>
                  </div>
                </div>

                <img
                  src="/images/future-outlook/apartment.png"
                  alt="Investment Properties"
                  className="w-[100px] h-auto object-contain absolute bottom-3 right-3 pointer-events-none"
                />
              </div>

              {/* Card 3: Superannuation */}
              <div className="bg-[#F3EFFD] rounded-[16px] p-6 border border-[#DDD6FE]/40 relative min-h-[260px] flex flex-col justify-between overflow-hidden">
                <div>
                  <div className="flex items-center justify-between pb-3.5 border-b border-[#DDD6FE]/60">
                    <h3 className="font-['Poppins',sans-serif] text-[16px] font-bold text-[#0E2841]">
                      Superannuation
                    </h3>
                    <span className="text-[13px] font-medium text-[#64748B]">
                      {targetYear}
                    </span>
                  </div>

                  <div className="mt-4">
                    <p className="text-[13px] text-[#475569] leading-relaxed max-w-[240px]">
                      Your Superannuation is a key component of retirement
                      income please see a licenced financial planner. Projected
                      balance at {targetYear}:{" "}
                      <strong className="text-[#0E2841]">
                        {fmtMoney(futureOutlookData.projectedSuperBal)}
                      </strong>
                      .
                    </p>
                  </div>
                </div>

                <img
                  src="/images/future-outlook/coins.png"
                  alt="Superannuation"
                  className="w-[90px] h-auto object-contain absolute bottom-3 right-3 pointer-events-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 5: PORTFOLIO MANAGEMENT INSIGHTS (Figma 555:13584 & 852:19901)*/}
      {/* ================================================================= */}
      {activeTab === "insights" && (
        <div className="space-y-6 pt-2">
          {/* Card 1: Property Insights & Recommendations Table (555:13584) */}
          <div className="bg-white rounded-[12px] p-[24px] shadow-[0px_11px_18px_0px_rgba(0,0,0,0.04)]">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h2 className="text-[18px] font-bold text-[#0e2841]">
                Property Insights &amp; Recommendations (
                {filteredInsights.length})
              </h2>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] text-[#6b6b6b]">Filter by:</span>
                  <div className="bg-[#f2f1f2] rounded-[8px] p-[4px] inline-flex items-center gap-1">
                    {(["All", "High", "Medium", "Low"] as const).map((prio) => {
                      const isActive = priorityFilter === prio;
                      return (
                        <button
                          key={prio}
                          type="button"
                          onClick={() => setPriorityFilter(prio)}
                          className={`h-[28px] px-[12px] text-[12px] transition-all cursor-pointer ${
                            isActive
                              ? "bg-white rounded-[4px] font-semibold text-[#1a1c1e] shadow-2xs"
                              : "bg-transparent rounded-[5px] font-medium text-[#a0a0a0] hover:text-[#1a1c1e]"
                          }`}
                        >
                          {prio === "All"
                            ? `All Priorities (${insights.length})`
                            : prio}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddInsightOpen(true)}
                  className="bg-[#0e2841] hover:bg-[#163859] text-white h-[36px] px-[18px] rounded-[8px] text-[13px] font-medium flex items-center justify-center transition-colors cursor-pointer"
                >
                  + Add Insight
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1100px]">
                <thead>
                  <tr className="border-b border-[#F0F1F3] text-[12px] font-medium text-[#8C9BA8]">
                    <th className="py-3.5 px-2.5">
                      <div className="flex items-center gap-1">
                        <span>FY</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </div>
                    </th>
                    <th className="py-3.5 px-2.5">
                      <div className="flex items-center gap-1">
                        <span>Screen</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </div>
                    </th>
                    <th className="py-3.5 px-2.5">
                      <div className="flex items-center gap-1">
                        <span>Property</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </div>
                    </th>
                    <th className="py-3.5 px-2.5">
                      <div className="flex items-center gap-1">
                        <span>Maintenance insight</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </div>
                    </th>
                    <th className="py-3.5 px-2.5">
                      <div className="flex items-center gap-1">
                        <span>Metric</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </div>
                    </th>
                    <th className="py-3.5 px-2.5">
                      <div className="flex items-center gap-1">
                        <span>Heading</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </div>
                    </th>
                    <th className="py-3.5 px-2.5">
                      <div className="flex items-center gap-1">
                        <span>Insight</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </div>
                    </th>
                    <th className="py-3.5 px-2.5">
                      <div className="flex items-center gap-1">
                        <span>RECOMMENDATION</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </div>
                    </th>
                    <th className="py-3.5 px-2.5">
                      <div className="flex items-center gap-1">
                        <span>PRIORITY</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </div>
                    </th>
                    <th className="py-3.5 px-2.5">
                      <div className="flex items-center gap-1">
                        <span>Owner</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </div>
                    </th>
                    <th className="py-3.5 px-2.5">
                      <div className="flex items-center gap-1">
                        <span>Action</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </div>
                    </th>
                    <th className="py-3.5 px-2.5">
                      <div className="flex items-center gap-1">
                        <span>Notes</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F6F7F9] text-[13px] text-[#1A1C1E]">
                  {filteredInsights.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-[#FBFBFC] transition-colors"
                    >
                      <td className="py-4 px-2.5">{item.fy}</td>
                      <td className="py-4 px-2.5 whitespace-nowrap">
                        {item.screen}
                      </td>
                      <td className="py-4 px-2.5 font-medium whitespace-nowrap">
                        {item.property}
                      </td>
                      <td className="py-4 px-2.5 whitespace-nowrap">
                        {item.maintenanceInsight}
                      </td>
                      <td className="py-4 px-2.5 whitespace-nowrap">
                        {item.metric}
                      </td>
                      <td className="py-4 px-2.5 font-semibold text-[#0e2841] whitespace-nowrap">
                        {item.heading}
                      </td>
                      <td className="py-4 px-2.5 max-w-[200px] truncate">
                        {item.insight}
                      </td>
                      <td className="py-4 px-2.5 max-w-[210px] truncate">
                        {item.recommendation}
                      </td>
                      <td className="py-4 px-2.5 font-medium">
                        {item.priority}
                      </td>
                      <td className="py-4 px-2.5">{item.owner}</td>
                      <td className="py-4 px-2.5 whitespace-nowrap">
                        {item.action}
                      </td>
                      <td className="py-4 px-2.5 text-[#6b6b6b] whitespace-nowrap">
                        {item.notes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Priority Cards Breakdown (Figma 852:19901 / 853:20587) */}
          <div className="space-y-5">
            {/* High Priority Section */}
            <div className="bg-white rounded-[12px] p-[24px] shadow-[0px_11px_18px_0px_rgba(0,0,0,0.04)]">
              <p className="text-[13px] font-semibold text-[#DC2626] mb-2">
                High Priority
              </p>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-semibold text-[#0e2841] uppercase tracking-wide">
                  PROPERTY ANALYSIS – INSIGHTS &amp; RECOMMENDATIONS
                </h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-[#f6f9fb] rounded-[10px] p-5 text-[13.5px] leading-relaxed text-[#434750] space-y-1.5">
                  <p className="font-semibold text-[#0e2841] text-[14.5px]">
                    Rental Income Review
                  </p>
                  <p>
                    <span className="font-medium text-[#1a1c1e]">
                      Observation:
                    </span>{" "}
                    Current rental income may differ from the local market rent
                    benchmark.
                  </p>
                  <p>
                    <span className="font-medium text-[#1a1c1e]">
                      Recommendation:
                    </span>{" "}
                    Review the current rent against the relevant market
                    benchmark.
                  </p>
                </div>

                <div className="bg-[#f6f9fb] rounded-[10px] p-5 text-[13.5px] leading-relaxed text-[#434750] space-y-1.5">
                  <p className="font-semibold text-[#0e2841] text-[14.5px]">
                    Property Valuation Review
                  </p>
                  <p>
                    <span className="font-medium text-[#1a1c1e]">
                      Observation:
                    </span>{" "}
                    The property&apos;s current valuation should be reviewed
                    against its previous valuation.
                  </p>
                  <p>
                    <span className="font-medium text-[#1a1c1e]">
                      Recommendation:
                    </span>{" "}
                    Verify the latest valuation and record the review date and
                    source.
                  </p>
                </div>
              </div>
            </div>

            {/* Medium Priority Section */}
            <div className="bg-white rounded-[12px] p-[24px] shadow-[0px_11px_18px_0px_rgba(0,0,0,0.04)]">
              <p className="text-[13px] font-semibold text-[#D97706] mb-2">
                Medium Priority
              </p>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-semibold text-[#0e2841] uppercase tracking-wide">
                  PROPERTY ANALYSIS – INSIGHTS &amp; RECOMMENDATIONS
                </h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-[#f6f9fb] rounded-[10px] p-5 text-[13.5px] leading-relaxed text-[#434750] space-y-1.5">
                  <p className="font-semibold text-[#0e2841] text-[14.5px]">
                    Reduce Operating Expenses
                  </p>
                  <p>
                    <span className="font-medium text-[#1a1c1e]">
                      Observation:
                    </span>{" "}
                    Property operating expenses should be reviewed against
                    available records and relevant benchmarks.
                  </p>
                  <p>
                    <span className="font-medium text-[#1a1c1e]">
                      Recommendation:
                    </span>{" "}
                    Review insurance premiums, property management fees and
                    maintenance costs for potential savings.
                  </p>
                </div>

                <div className="bg-[#f6f9fb] rounded-[10px] p-5 text-[13.5px] leading-relaxed text-[#434750] space-y-1.5">
                  <p className="font-semibold text-[#0e2841] text-[14.5px]">
                    Rental Income &amp; Cash Flow
                  </p>
                  <p>
                    <span className="font-medium text-[#1a1c1e]">
                      Observation:
                    </span>{" "}
                    Rental income and property expenses determine the
                    property&apos;s operating cash position.
                  </p>
                  <p>
                    <span className="font-medium text-[#1a1c1e]">
                      Recommendation:
                    </span>{" "}
                    Review rental income, vacancy periods and recurring expenses
                    to identify possible cash-flow improvements.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: ADD INSIGHT & RECOMMENDATION FY2026 (Figma 537:6786)        */}
      {/* ================================================================= */}
      {isAddInsightOpen && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[16px] w-full max-w-[588px] p-6 sm:p-8 shadow-2xl relative my-8">
            <button
              type="button"
              onClick={() => setIsAddInsightOpen(false)}
              className="absolute top-6 right-6 w-[36px] h-[36px] rounded-full bg-[#0e2841] text-white flex items-center justify-center hover:bg-[#163859] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-[20px] font-bold text-[#0e2841] font-['Poppins',sans-serif] text-center pr-8">
              Add Insight &amp; Recommendation FY{reviewYear}
            </h2>

            <form
              onSubmit={handleAddInsightSubmit}
              className="mt-6 space-y-4 text-[13.5px]"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-[#1a1c1e] mb-1.5">
                    Select Property
                  </label>
                  <select
                    value={newInsightProperty}
                    onChange={(e) => setNewInsightProperty(e.target.value)}
                    className="w-full h-[44px] px-3.5 rounded-[8px] bg-[#f6f9fb] border border-[#dce4e8] text-[#1a1c1e] focus:outline-none focus:border-[#0e2841]"
                  >
                    {propertiesList.map((p) => (
                      <option key={p.id} value={p.address}>
                        {p.address}
                      </option>
                    ))}
                    <option value="Portfolio-Wide">Portfolio-Wide</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#1a1c1e] mb-1.5">
                    Metric / Area
                  </label>
                  <select
                    value={newInsightMetric}
                    onChange={(e) => setNewInsightMetric(e.target.value)}
                    className="w-full h-[44px] px-3.5 rounded-[8px] bg-[#f6f9fb] border border-[#dce4e8] text-[#1a1c1e] focus:outline-none focus:border-[#0e2841]"
                  >
                    <option value="Rental Income">Rental Income</option>
                    <option value="Valuation">Valuation</option>
                    <option value="Operating Expenses">
                      Operating Expenses
                    </option>
                    <option value="Debt & Refinancing">
                      Debt &amp; Refinancing
                    </option>
                    <option value="Capital Growth">Capital Growth</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#1a1c1e] mb-1.5">
                  Heading <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newInsightHeading}
                  onChange={(e) => setNewInsightHeading(e.target.value)}
                  placeholder="e.g. Rental Income Review"
                  className="w-full h-[44px] px-3.5 rounded-[8px] bg-[#f6f9fb] border border-[#dce4e8] text-[#1a1c1e] focus:outline-none focus:border-[#0e2841]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#1a1c1e] mb-1.5">
                  Observation / Insight
                </label>
                <textarea
                  rows={3}
                  value={newInsightObservation}
                  onChange={(e) => setNewInsightObservation(e.target.value)}
                  placeholder="Enter observation..."
                  className="w-full p-3.5 rounded-[8px] bg-[#f6f9fb] border border-[#dce4e8] text-[#1a1c1e] focus:outline-none focus:border-[#0e2841]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#1a1c1e] mb-1.5">
                  Recommendation
                </label>
                <textarea
                  rows={3}
                  value={newInsightRecommendation}
                  onChange={(e) => setNewInsightRecommendation(e.target.value)}
                  placeholder="Enter recommendation..."
                  className="w-full p-3.5 rounded-[8px] bg-[#f6f9fb] border border-[#dce4e8] text-[#1a1c1e] focus:outline-none focus:border-[#0e2841]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#1a1c1e] mb-1.5">
                  Priority
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(["High", "Medium", "Low"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNewInsightPriority(p)}
                      className={`h-[40px] rounded-[8px] font-medium border transition-colors cursor-pointer ${
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-[#1a1c1e] mb-1.5">
                    Owner
                  </label>
                  <select
                    value={newInsightOwner}
                    onChange={(e) => setNewInsightOwner(e.target.value)}
                    className="w-full h-[44px] px-3.5 rounded-[8px] bg-[#f6f9fb] border border-[#dce4e8] text-[#1a1c1e] focus:outline-none focus:border-[#0e2841]"
                  >
                    <option value="Adviser">Adviser</option>
                    <option value="Client">Client</option>
                    <option value="Mortgage Broker">Mortgage Broker</option>
                    <option value="Property Manager">Property Manager</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#1a1c1e] mb-1.5">
                    Target Action
                  </label>
                  <input
                    type="text"
                    value={newInsightAction}
                    onChange={(e) => setNewInsightAction(e.target.value)}
                    placeholder="e.g. Reset rent Q3"
                    className="w-full h-[44px] px-3.5 rounded-[8px] bg-[#f6f9fb] border border-[#dce4e8] text-[#1a1c1e] focus:outline-none focus:border-[#0e2841]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#1a1c1e] mb-1.5">
                  Notes
                </label>
                <input
                  type="text"
                  value={newInsightNotes}
                  onChange={(e) => setNewInsightNotes(e.target.value)}
                  placeholder="Optional notes..."
                  className="w-full h-[44px] px-3.5 rounded-[8px] bg-[#f6f9fb] border border-[#dce4e8] text-[#1a1c1e] focus:outline-none focus:border-[#0e2841]"
                />
              </div>

              <div className="pt-3 flex justify-center">
                <button
                  type="submit"
                  className="bg-[#0e2841] hover:bg-[#163859] text-white h-[44px] px-[42px] rounded-[8px] text-[14px] font-medium transition-colors cursor-pointer"
                >
                  Save Insight
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
