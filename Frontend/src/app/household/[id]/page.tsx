"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Plus, ChevronDown, Trash2 } from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import TopNav from "@/components/dashboard/TopNav";
import AddEntityModal from "@/components/household/AddEntityModal";
import AddPropertyModal, {
  NewPropertyFormPayload,
} from "@/components/household/AddPropertyModal";
import AddLoanModal, {
  NewLoanFormPayload,
} from "@/components/household/AddLoanModal";
import FinancialDataInput from "@/components/household/FinancialDataInput";
import ReviewWorkspaceReport from "@/components/household/ReviewWorkspaceReport";
import {
  fetchHouseholdById,
  createEntityApi,
  deleteEntityApi,
  createPropertyApi,
  deletePropertyApi,
  createLoanApi,
  deleteLoanApi,
  setActiveHouseholdInfo,
} from "@/lib/api";

type HouseholdTab =
  | "client-entity"
  | "properties-loans"
  | "review-workspace"
  | "report"
  | "insights-recommendations";

interface ClientEntityRow {
  id: string;
  name: string;
  age: string;
  mobile: string;
  email: string;
  entityType: string;
}

interface PropertyRow {
  id: string;
  address: string;
  type: string;
  purpose: string;
  purchaseDate: string;
  purchasePrice: string;
  purchaseCost: string;
  size: string;
  beds: number;
  baths: number;
  cars: number;
  owner1: string;
  owner1Pct: string;
  owner2: string;
  owner2Pct: string;
}

interface LoanRow {
  id: string;
  lender: string;
  loanReferences: string;
  tchLoan: "yes" | "No";
  purpose: string;
  repayment: string;
  rateType: string;
  ioExpiry: string;
  fixedExpiry: string;
  maturity: string;
  security1: string;
  security2: string;
  security3: string;
}

interface ReviewWorkspaceRow {
  id: string;
  fy: string;
  finDataInput: "Completed" | "In Progress";
  reviewStatus: "Completed" | "In Progress";
  reviewDate: string;
}

interface ReportRow {
  id: string;
  fy: string;
  reportStatus: "Completed" | "In Progress" | "Not started";
  share: string;
  shareDate: string;
  complianceAcknowledged: string;
}

interface InsightRecommendationRow {
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

function formatMoney(val: any): string {
  const num = Number(String(val ?? 0).replace(/[^0-9.-]/g, ""));
  if (isNaN(num)) return "$0";
  return `$${num.toLocaleString("en-AU", { maximumFractionDigits: 0 })}`;
}

function parseNumeric(val: any, fallback = 0): number {
  const num = Number(String(val ?? "").replace(/[^0-9.-]/g, ""));
  return isNaN(num) || num === 0 ? fallback : num;
}

function sortTableData<T>(
  data: T[],
  sortConfig: { field: keyof T; dir: "asc" | "desc" } | null
): T[] {
  if (!sortConfig) return data;
  const { field, dir } = sortConfig;

  return [...data].sort((a, b) => {
    const valA = a[field];
    const valB = b[field];

    if (valA === valB) return 0;
    if (
      valA === null ||
      valA === undefined ||
      valA === "" ||
      valA === "-" ||
      valA === "--" ||
      valA === "---" ||
      valA === "----"
    )
      return 1;
    if (
      valB === null ||
      valB === undefined ||
      valB === "" ||
      valB === "-" ||
      valB === "--" ||
      valB === "---" ||
      valB === "----"
    )
      return -1;

    const cleanA = String(valA).replace(/[\$,]/g, "").replace(/%$/, "").trim();
    const cleanB = String(valB).replace(/[\$,]/g, "").replace(/%$/, "").trim();

    if (!isNaN(Number(cleanA)) && !isNaN(Number(cleanB))) {
      return dir === "asc"
        ? Number(cleanA) - Number(cleanB)
        : Number(cleanB) - Number(cleanA);
    }

    const dateMatchA = String(valA).match(
      /^(\d{1,2})[\/\s-]+(\d{1,2})[\/\s-]+(\d{2,4})$/
    );
    const dateMatchB = String(valB).match(
      /^(\d{1,2})[\/\s-]+(\d{1,2})[\/\s-]+(\d{2,4})$/
    );
    if (dateMatchA && dateMatchB) {
      const yearA =
        dateMatchA[3].length === 2 ? `20${dateMatchA[3]}` : dateMatchA[3];
      const yearB =
        dateMatchB[3].length === 2 ? `20${dateMatchB[3]}` : dateMatchB[3];
      const timeA = new Date(
        `${yearA}-${dateMatchA[2].padStart(2, "0")}-${dateMatchA[1].padStart(
          2,
          "0"
        )}`
      ).getTime();
      const timeB = new Date(
        `${yearB}-${dateMatchB[2].padStart(2, "0")}-${dateMatchB[1].padStart(
          2,
          "0"
        )}`
      ).getTime();
      return dir === "asc" ? timeA - timeB : timeB - timeA;
    }

    const strA = String(valA).toLowerCase();
    const strB = String(valB).toLowerCase();
    return dir === "asc" ? strA.localeCompare(strB) : strB.localeCompare(strA);
  });
}

export default function HouseholdSingleViewPage() {
  const params = useParams();
  const rawId = (params?.id as string) || "";

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<HouseholdTab>("client-entity");
  const [selectedFinDataReview, setSelectedFinDataReview] =
    useState<ReviewWorkspaceRow | null>(null);
  const [selectedReviewStatusRow, setSelectedReviewStatusRow] =
    useState<ReviewWorkspaceRow | null>(null);

  // DB State
  const [loading, setLoading] = useState(true);
  const [dbHousehold, setDbHousehold] = useState<any>(null);
  const [householdId, setHouseholdId] = useState<string>("");
  const [householdName, setHouseholdName] = useState<string>("Loading...");

  const [entities, setEntities] = useState<ClientEntityRow[]>([]);
  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [loans, setLoans] = useState<LoanRow[]>([]);
  const [reviews, setReviews] = useState<ReviewWorkspaceRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [insights, setInsights] = useState<InsightRecommendationRow[]>([]);

  const loadHouseholdFromDb = useCallback(async () => {
    if (!rawId) return;
    try {
      const h = await fetchHouseholdById(rawId);
      setDbHousehold(h);
      setHouseholdId(h.id);
      setHouseholdName(h.householdName || "Household");
      setActiveHouseholdInfo(h.id, h.householdName || "Household");

      // Map Entities from DB
      const dbEntities: ClientEntityRow[] = Array.isArray(h.entities)
        ? h.entities.map((e: any) => ({
            id: e.id,
            name: e.name,
            age: e.ageOrDob || "---",
            mobile: e.phone || "-",
            email: e.email || "-",
            entityType: e.displayType || e.type || "Individual",
          }))
        : [];
      setEntities(dbEntities);

      // Map Properties from DB
      const dbProps: PropertyRow[] = Array.isArray(h.properties)
        ? h.properties.map((p: any) => ({
            id: p.id,
            address: p.address,
            type: p.propertyCategory || "House",
            purpose:
              p.purposeDisplay ||
              (p.type === "OWNER_OCCUPIED" ? "Owner-Occupied" : "Investment"),
            purchaseDate:
              p.purchaseDateStr ||
              (p.purchaseDate
                ? new Date(p.purchaseDate).toLocaleDateString("en-GB")
                : "24/10/2026"),
            purchasePrice: formatMoney(p.purchasePrice),
            purchaseCost: formatMoney(p.acquisitionCosts ?? 45936),
            size: p.landSize || "600",
            beds: Number(p.beds ?? 4),
            baths: Number(p.baths ?? 2),
            cars: Number(p.cars ?? 2),
            owner1: p.owner1 || p.entity?.name || "Primary Owner",
            owner1Pct: p.owner1Pct || "100%",
            owner2: p.owner2 || "----",
            owner2Pct: p.owner2Pct || "---",
          }))
        : [];
      setProperties(dbProps);

      // Map Loans from DB (nested under properties)
      const dbLoans: LoanRow[] = [];
      if (Array.isArray(h.properties)) {
        for (const p of h.properties) {
          if (Array.isArray(p.loans)) {
            for (const l of p.loans) {
              dbLoans.push({
                id: l.id,
                lender: l.lender,
                loanReferences: l.loanReference || l.accountName || l.id.slice(0, 8),
                tchLoan: l.isTchLoan ? "yes" : "No",
                purpose: l.purpose || "Investment",
                repayment: l.repaymentType || l.loanType || "Interest only",
                rateType: l.rateType || "Variable",
                ioExpiry: l.ioExpiry || "----",
                fixedExpiry: l.fixedExpiry || "----",
                maturity: l.maturityDate || "24/10/2026",
                security1: l.security1 || p.address,
                security2: l.security2 || "----",
                security3: l.security3 || "----",
              });
            }
          }
        }
      }
      setLoans(dbLoans);

      // Map Reviews, Reports & Insights from DB
      const dbReviews: ReviewWorkspaceRow[] = [];
      const dbReports: ReportRow[] = [];
      const dbInsights: InsightRecommendationRow[] = [];

      if (Array.isArray(h.reviews)) {
        for (const r of h.reviews) {
          const fyStr = String(r.financialYear);
          const dateStr =
            r.reviewDateStr ||
            (r.reviewDate
              ? new Date(r.reviewDate).toLocaleDateString("en-GB")
              : new Date(r.createdAt || Date.now()).toLocaleDateString("en-GB"));

          dbReviews.push({
            id: r.id,
            fy: fyStr,
            finDataInput:
              r.finDataStatus === "COMPLETED" ? "Completed" : "In Progress",
            reviewStatus:
              r.tchReviewStatus === "COMPLETED" ? "Completed" : "In Progress",
            reviewDate: dateStr,
          });

          dbReports.push({
            id: r.id,
            fy: fyStr,
            reportStatus:
              r.tchReviewStatus === "COMPLETED"
                ? "Completed"
                : r.tchReviewStatus === "IN_PROGRESS"
                ? "In Progress"
                : "Not started",
            share: r.shareChannel || "Launch",
            shareDate: dateStr,
            complianceAcknowledged: r.complianceAcknowledged || "-",
          });

          if (Array.isArray(r.criteria)) {
            for (const c of r.criteria) {
              const prioRaw = String(c.priority || "MEDIUM").toUpperCase();
              const prio: "High" | "Medium" | "Low" =
                prioRaw === "HIGH"
                  ? "High"
                  : prioRaw === "LOW"
                  ? "Low"
                  : "Medium";

              dbInsights.push({
                id: c.id,
                fy: fyStr,
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
      }

      setReviews(dbReviews);
      setReports(dbReports);
      setInsights(dbInsights);
    } catch (err) {
      console.error("Failed to fetch household details from DB:", err);
    } finally {
      setLoading(false);
    }
  }, [rawId]);

  useEffect(() => {
    setLoading(true);
    loadHouseholdFromDb();
  }, [loadHouseholdFromDb]);

  // Sorting States for each table
  const [entitySort, setEntitySort] = useState<{
    field: keyof ClientEntityRow;
    dir: "asc" | "desc";
  } | null>(null);

  const [propertySort, setPropertySort] = useState<{
    field: keyof PropertyRow;
    dir: "asc" | "desc";
  } | null>(null);

  const [loanSort, setLoanSort] = useState<{
    field: keyof LoanRow;
    dir: "asc" | "desc";
  } | null>(null);

  const [reviewSort, setReviewSort] = useState<{
    field: keyof ReviewWorkspaceRow;
    dir: "asc" | "desc";
  } | null>(null);

  const [reportSort, setReportSort] = useState<{
    field: keyof ReportRow;
    dir: "asc" | "desc";
  } | null>(null);

  const [insightSort, setInsightSort] = useState<{
    field: keyof InsightRecommendationRow;
    dir: "asc" | "desc";
  } | null>(null);

  // Sorted Datasets
  const sortedEntities = useMemo(
    () => sortTableData(entities, entitySort),
    [entities, entitySort]
  );
  const sortedProperties = useMemo(
    () => sortTableData(properties, propertySort),
    [properties, propertySort]
  );
  const sortedLoans = useMemo(
    () => sortTableData(loans, loanSort),
    [loans, loanSort]
  );
  const sortedReviews = useMemo(
    () => sortTableData(reviews, reviewSort),
    [reviews, reviewSort]
  );
  const sortedReports = useMemo(
    () => sortTableData(reports, reportSort),
    [reports, reportSort]
  );
  const sortedInsights = useMemo(
    () => sortTableData(insights, insightSort),
    [insights, insightSort]
  );

  // Sorting click handlers
  const toggleEntitySort = (field: keyof ClientEntityRow) => {
    setEntitySort((prev) => ({
      field,
      dir: prev?.field === field && prev.dir === "asc" ? "desc" : "asc",
    }));
  };

  const togglePropertySort = (field: keyof PropertyRow) => {
    setPropertySort((prev) => ({
      field,
      dir: prev?.field === field && prev.dir === "asc" ? "desc" : "asc",
    }));
  };

  const toggleLoanSort = (field: keyof LoanRow) => {
    setLoanSort((prev) => ({
      field,
      dir: prev?.field === field && prev.dir === "asc" ? "desc" : "asc",
    }));
  };

  const toggleReviewSort = (field: keyof ReviewWorkspaceRow) => {
    setReviewSort((prev) => ({
      field,
      dir: prev?.field === field && prev.dir === "asc" ? "desc" : "asc",
    }));
  };

  const toggleReportSort = (field: keyof ReportRow) => {
    setReportSort((prev) => ({
      field,
      dir: prev?.field === field && prev.dir === "asc" ? "desc" : "asc",
    }));
  };

  const toggleInsightSort = (field: keyof InsightRecommendationRow) => {
    setInsightSort((prev) => ({
      field,
      dir: prev?.field === field && prev.dir === "asc" ? "desc" : "asc",
    }));
  };

  // Modals
  const [isEntityModalOpen, setIsEntityModalOpen] = useState(false);
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);

  const superTitle = useMemo(() => {
    if (activeTab === "report" || activeTab === "insights-recommendations") {
      return "Household";
    }
    return "HOUSEHOLD HUB";
  }, [activeTab]);

  const pageTitle = useMemo(() => {
    if (activeTab === "report" || activeTab === "insights-recommendations") {
      return `The ${householdName} Dashboard`;
    }
    return householdName;
  }, [activeTab, householdName]);

  // DB Modal Handlers
  const handleAddEntity = async (newE: {
    name: string;
    type: string;
    abn: string;
    email: string;
    phone: string;
    regDate: string;
  }) => {
    if (!householdId) return;
    await createEntityApi(householdId, {
      name: newE.name,
      type: newE.type,
      displayType: newE.type,
      abnOrTfnMasked: newE.abn,
      ageOrDob: newE.regDate || "---",
      phone: newE.phone,
      email: newE.email,
    });
    await loadHouseholdFromDb();
  };

  const handleDeleteEntity = async (entityId: string) => {
    if (!householdId) return;
    await deleteEntityApi(householdId, entityId);
    await loadHouseholdFromDb();
  };

  const handleAddProperty = async (p: NewPropertyFormPayload) => {
    if (!householdId) return;
    const fullAddress =
      p.address.includes(p.state) || p.address.includes(p.postcode)
        ? p.address
        : `${p.address}, ${p.state} ${p.postcode}`;

    await createPropertyApi(householdId, {
      name: fullAddress,
      address: fullAddress,
      state: p.state,
      postcode: p.postcode,
      propertyCategory: p.type,
      purposeDisplay: p.purpose,
      type: p.purpose,
      purchaseDateStr: p.purchaseDate,
      purchasePrice: parseNumeric(p.purchasePrice, 800000),
      currentValuation: parseNumeric(p.currentValue, 1150000),
      weeklyRent: parseNumeric(p.rentWeekly, 850),
      landSize: p.landSize,
      beds: p.beds,
      baths: p.baths,
      cars: p.cars,
      owner1: p.owner1,
      owner1Pct: p.owner1Pct,
      owner2: p.owner2,
      owner2Pct: p.owner2Pct,
      ownersJson: p.additionalPersons,
    });
    await loadHouseholdFromDb();
  };

  const handleAddLoan = async (l: NewLoanFormPayload) => {
    if (!householdId) return;
    await createLoanApi(householdId, {
      lender: l.lender,
      loanReference: l.loanReference,
      isTchLoan: l.isTchLoan,
      purpose: l.purpose,
      repaymentType: l.repaymentType,
      rateType: l.loanType,
      ioExpiry: l.ioExpiry,
      fixedExpiry: l.fixedExpiry,
      maturityDate: l.maturityDate,
      security1: l.security1,
      security2: l.security2,
      security3: l.security3,
      loanBalance: parseNumeric(l.balance, 650000),
      offsetBalance: parseNumeric(l.offsetBalance, 24000),
      interestRate: parseNumeric(l.rate, 5.94),
    });
    await loadHouseholdFromDb();
  };

  const handleDeleteProperty = async (id: string) => {
    if (!householdId) return;
    await deletePropertyApi(householdId, id);
    await loadHouseholdFromDb();
  };

  const handleDeleteLoan = async (id: string) => {
    if (!householdId) return;
    await deleteLoanApi(householdId, id);
    await loadHouseholdFromDb();
  };

  return (
    <div className="h-screen w-full bg-[#FBFBFC] flex overflow-hidden select-none font-['Inter',sans-serif]">
      {/* Sidebar - fixed on left */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeSubItemLabel={
          selectedReviewStatusRow
            ? `${householdName} -\nReview Workspace`
            : householdName
        }
      />

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto min-w-0">
        <TopNav onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 p-6 sm:p-9 max-w-[1440px] w-full mx-auto">
          {selectedFinDataReview ? (
            <FinancialDataInput
              householdId={householdId}
              reviewId={selectedFinDataReview.id}
              dbHousehold={dbHousehold}
              onDataChanged={loadHouseholdFromDb}
              year={selectedFinDataReview.fy}
              status={selectedFinDataReview.finDataInput}
              householdName={householdName}
              onBackToWorkspace={() => {
                setSelectedFinDataReview(null);
                loadHouseholdFromDb();
              }}
            />
          ) : selectedReviewStatusRow ? (
            <ReviewWorkspaceReport
              householdId={householdId}
              reviewId={selectedReviewStatusRow.id}
              dbHousehold={dbHousehold}
              onDataChanged={loadHouseholdFromDb}
              householdName={householdName}
              reviewYear={selectedReviewStatusRow.fy}
              reviewStatus={selectedReviewStatusRow.reviewStatus}
              onBack={() => {
                setSelectedReviewStatusRow(null);
                loadHouseholdFromDb();
              }}
            />
          ) : (
            <>
              {/* Super-title / Breadcrumb */}
              <div className="mb-2">
                <span className="text-[13px] font-medium text-[#8C9BA8] tracking-normal font-['Poppins',sans-serif]">
                  {superTitle}
                </span>
              </div>

              {/* Heading */}
              <div className="mb-6">
                <h1 className="text-[26px] sm:text-[28px] font-bold text-[#071E36] tracking-tight font-['Poppins',sans-serif]">
                  {pageTitle}
                </h1>
              </div>

              {/* Tab Navigation Pill Container */}
              <div className="bg-[#F2F1F3] p-[4px] rounded-[10px] inline-flex items-center gap-[4px] mb-8 max-w-full overflow-x-auto">
                {[
                  {
                    id: "client-entity" as HouseholdTab,
                    label: "Client & Entity Setup",
                  },
                  {
                    id: "properties-loans" as HouseholdTab,
                    label: "Properties & Loans Setup",
                  },
                  {
                    id: "review-workspace" as HouseholdTab,
                    label: "Review Workspace",
                  },
                  { id: "report" as HouseholdTab, label: "Report" },
                  {
                    id: "insights-recommendations" as HouseholdTab,
                    label: "Insights & Recommendations",
                  },
                ].map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setSelectedFinDataReview(null);
                      }}
                      className={`px-[18px] py-[8px] rounded-[7px] text-[13.5px] font-medium transition-all whitespace-nowrap cursor-pointer ${
                        isActive
                          ? "bg-white text-[#071E36] shadow-[0px_2px_6px_rgba(0,0,0,0.06)] font-semibold"
                          : "text-[#9AA5B1] hover:text-[#071E36]"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* ========================================================== */}
              {/* Tab 1 - Client & Entity Setup */}
              {/* ========================================================== */}
              {activeTab === "client-entity" && (
                <div className="relative">
                  <div className="flex justify-end mb-4">
                    <button
                      onClick={() => setIsEntityModalOpen(true)}
                      className="bg-[#071E36] hover:bg-[#122D4D] text-white h-[42px] px-[18px] rounded-[8px] text-[13.5px] font-medium flex items-center gap-[9px] transition-colors cursor-pointer shadow-xs"
                    >
                      <Plus className="w-4 h-4 stroke-[2.2]" />
                      <span>Add Client / Entity</span>
                    </button>
                  </div>

                  <div className="bg-white rounded-[16px] p-6 sm:p-8 shadow-[0px_2px_12px_rgba(0,0,0,0.03)] border border-[#EDEDF0] overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                      <thead>
                        <tr className="border-b border-[#F0F1F3]">
                          <th className="py-3 px-3 font-medium text-[13.5px] text-[#8C9BA8]">
                            <div
                              onClick={() => toggleEntitySort("name")}
                              className="flex items-center gap-1.5 cursor-pointer"
                            >
                              <span>Client /Entity Name</span>
                              <ChevronDown
                                className={`w-3.5 h-3.5 transition-transform ${
                                  entitySort?.field === "name" &&
                                  entitySort.dir === "desc"
                                    ? "rotate-180"
                                    : ""
                                }`}
                              />
                            </div>
                          </th>
                          <th className="py-3 px-3 font-medium text-[13.5px] text-[#8C9BA8]">
                            <div
                              onClick={() => toggleEntitySort("age")}
                              className="flex items-center gap-1.5 cursor-pointer"
                            >
                              <span>Age</span>
                              <ChevronDown
                                className={`w-3.5 h-3.5 transition-transform ${
                                  entitySort?.field === "age" &&
                                  entitySort.dir === "desc"
                                    ? "rotate-180"
                                    : ""
                                }`}
                              />
                            </div>
                          </th>
                          <th className="py-3 px-3 font-medium text-[13.5px] text-[#8C9BA8]">
                            <div
                              onClick={() => toggleEntitySort("mobile")}
                              className="flex items-center gap-1.5 cursor-pointer"
                            >
                              <span>Mobile</span>
                              <ChevronDown
                                className={`w-3.5 h-3.5 transition-transform ${
                                  entitySort?.field === "mobile" &&
                                  entitySort.dir === "desc"
                                    ? "rotate-180"
                                    : ""
                                }`}
                              />
                            </div>
                          </th>
                          <th className="py-3 px-3 font-medium text-[13.5px] text-[#8C9BA8]">
                            <div
                              onClick={() => toggleEntitySort("email")}
                              className="flex items-center gap-1.5 cursor-pointer"
                            >
                              <span>Email</span>
                              <ChevronDown
                                className={`w-3.5 h-3.5 transition-transform ${
                                  entitySort?.field === "email" &&
                                  entitySort.dir === "desc"
                                    ? "rotate-180"
                                    : ""
                                }`}
                              />
                            </div>
                          </th>
                          <th className="py-3 px-3 font-medium text-[13.5px] text-[#8C9BA8]">
                            <div
                              onClick={() => toggleEntitySort("entityType")}
                              className="flex items-center gap-1.5 cursor-pointer"
                            >
                              <span>Entity Type</span>
                              <ChevronDown
                                className={`w-3.5 h-3.5 transition-transform ${
                                  entitySort?.field === "entityType" &&
                                  entitySort.dir === "desc"
                                    ? "rotate-180"
                                    : ""
                                }`}
                              />
                            </div>
                          </th>
                          <th className="py-3 px-3 font-medium text-[13.5px] text-[#8C9BA8] text-right">
                            <div className="flex items-center justify-end gap-1.5 cursor-pointer">
                              <span>Actions</span>
                              <ChevronDown className="w-3.5 h-3.5" />
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F6F7F9]">
                        {loading ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="py-6 text-center text-[13.5px] text-[#8C9BA8]"
                            >
                              Loading client &amp; entities from database...
                            </td>
                          </tr>
                        ) : sortedEntities.length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="py-6 text-center text-[13.5px] text-[#8C9BA8]"
                            >
                              No client/entities in database yet. Click &quot;+
                              Add Client / Entity&quot; to add one.
                            </td>
                          </tr>
                        ) : (
                          sortedEntities.map((row) => (
                            <tr
                              key={row.id}
                              className="hover:bg-[#FBFBFC] transition-colors"
                            >
                              <td className="py-4 px-3 text-[14px] text-[#1A1C1E] font-medium">
                                {row.name}
                              </td>
                              <td className="py-4 px-3 text-[14px] text-[#1A1C1E]">
                                {row.age}
                              </td>
                              <td className="py-4 px-3 text-[14px] text-[#1A1C1E]">
                                {row.mobile}
                              </td>
                              <td className="py-4 px-3 text-[14px] text-[#1A1C1E]">
                                {row.email}
                              </td>
                              <td className="py-4 px-3 text-[14px] text-[#1A1C1E] font-medium">
                                {row.entityType}
                              </td>
                              <td className="py-4 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteEntity(row.id)}
                                  className="p-1 text-[#8C9BA8] hover:text-red-500 transition-colors cursor-pointer"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ========================================================== */}
              {/* Tab 2 - Properties & Loans Setup */}
              {/* ========================================================== */}
              {activeTab === "properties-loans" && (
                <div className="space-y-8">
                  {/* Card 1: Properties */}
                  <div className="bg-white rounded-[16px] p-6 sm:p-8 shadow-[0px_2px_12px_rgba(0,0,0,0.03)] border border-[#EDEDF0]">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-[19px] font-bold text-[#071E36] font-['Poppins',sans-serif]">
                        Properties
                      </h2>
                      <button
                        onClick={() => setIsPropertyModalOpen(true)}
                        className="bg-[#071E36] hover:bg-[#122D4D] text-white h-[40px] px-[18px] rounded-[8px] text-[13.5px] font-medium flex items-center gap-[8px] transition-colors cursor-pointer shadow-xs"
                      >
                        <Plus className="w-4 h-4 stroke-[2.2]" />
                        <span>Add Property</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[1100px]">
                        <thead>
                          <tr className="border-b border-[#F0F1F3]">
                            <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                              <div
                                onClick={() => togglePropertySort("address")}
                                className="flex items-center gap-1 cursor-pointer"
                              >
                                <span>Address</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                              </div>
                            </th>
                            <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                              <div
                                onClick={() => togglePropertySort("type")}
                                className="flex items-center gap-1 cursor-pointer"
                              >
                                <span>Type</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                              </div>
                            </th>
                            <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                              <div
                                onClick={() => togglePropertySort("purpose")}
                                className="flex items-center gap-1 cursor-pointer"
                              >
                                <span>Purpose</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                              </div>
                            </th>
                            <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                              <div
                                onClick={() =>
                                  togglePropertySort("purchaseDate")
                                }
                                className="flex items-center gap-1 cursor-pointer"
                              >
                                <span>Purchase Date</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                              </div>
                            </th>
                            <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                              <div
                                onClick={() =>
                                  togglePropertySort("purchasePrice")
                                }
                                className="flex items-center gap-1 cursor-pointer"
                              >
                                <span>Purchase price</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                              </div>
                            </th>
                            <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                              <div
                                onClick={() =>
                                  togglePropertySort("purchaseCost")
                                }
                                className="flex items-center gap-1 cursor-pointer"
                              >
                                <span>Purchase Cost</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                              </div>
                            </th>
                            <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                              <div
                                onClick={() => togglePropertySort("size")}
                                className="flex items-center gap-1 cursor-pointer"
                              >
                                <span>Size</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                              </div>
                            </th>
                            <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                              <div
                                onClick={() => togglePropertySort("beds")}
                                className="flex items-center gap-1 cursor-pointer"
                              >
                                <span>Beds</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                              </div>
                            </th>
                            <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                              <div
                                onClick={() => togglePropertySort("baths")}
                                className="flex items-center gap-1 cursor-pointer"
                              >
                                <span>Baths</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                              </div>
                            </th>
                            <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                              <div
                                onClick={() => togglePropertySort("cars")}
                                className="flex items-center gap-1 cursor-pointer"
                              >
                                <span>Cars</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                              </div>
                            </th>
                            <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                              <div
                                onClick={() => togglePropertySort("owner1")}
                                className="flex items-center gap-1 cursor-pointer"
                              >
                                <span>Owner 1</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                              </div>
                            </th>
                            <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                              <div
                                onClick={() => togglePropertySort("owner1Pct")}
                                className="flex items-center gap-1 cursor-pointer"
                              >
                                <span>%</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                              </div>
                            </th>
                            <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                              <div
                                onClick={() => togglePropertySort("owner2")}
                                className="flex items-center gap-1 cursor-pointer"
                              >
                                <span>Owner 2</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                              </div>
                            </th>
                            <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                              <div
                                onClick={() => togglePropertySort("owner2Pct")}
                                className="flex items-center gap-1 cursor-pointer"
                              >
                                <span>%</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                              </div>
                            </th>
                            <th className="py-3 px-3 text-right"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F6F7F9]">
                          {sortedProperties.length === 0 ? (
                            <tr>
                              <td
                                colSpan={15}
                                className="py-6 text-center text-[13.5px] text-[#8C9BA8]"
                              >
                                No properties in database for this household.
                                Click &quot;+ Add Property&quot; to add one.
                              </td>
                            </tr>
                          ) : (
                            sortedProperties.map((p) => (
                              <tr
                                key={p.id}
                                className="hover:bg-[#FBFBFC] transition-colors"
                              >
                                <td className="py-4 px-3 text-[13.5px] text-[#1A1C1E] font-medium max-w-[210px] leading-snug">
                                  {p.address}
                                </td>
                                <td className="py-4 px-3 text-[13.5px] text-[#1A1C1E]">
                                  {p.type}
                                </td>
                                <td className="py-4 px-3 text-[13.5px] text-[#1A1C1E]">
                                  {p.purpose}
                                </td>
                                <td className="py-4 px-3 text-[13.5px] text-[#1A1C1E]">
                                  {p.purchaseDate}
                                </td>
                                <td className="py-4 px-3 text-[13.5px] text-[#1A1C1E]">
                                  {p.purchasePrice}
                                </td>
                                <td className="py-4 px-3 text-[13.5px] text-[#1A1C1E]">
                                  {p.purchaseCost}
                                </td>
                                <td className="py-4 px-3 text-[13.5px] text-[#1A1C1E]">
                                  {p.size}
                                </td>
                                <td className="py-4 px-3 text-[13.5px] text-[#1A1C1E]">
                                  {p.beds}
                                </td>
                                <td className="py-4 px-3 text-[13.5px] text-[#1A1C1E]">
                                  {p.baths}
                                </td>
                                <td className="py-4 px-3 text-[13.5px] text-[#1A1C1E]">
                                  {p.cars}
                                </td>
                                <td className="py-4 px-3 text-[13.5px] text-[#1A1C1E]">
                                  {p.owner1}
                                </td>
                                <td className="py-4 px-3 text-[13.5px] text-[#1A1C1E]">
                                  {p.owner1Pct}
                                </td>
                                <td className="py-4 px-3 text-[13.5px] text-[#1A1C1E]">
                                  {p.owner2}
                                </td>
                                <td className="py-4 px-3 text-[13.5px] text-[#1A1C1E]">
                                  {p.owner2Pct}
                                </td>
                                <td className="py-4 px-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteProperty(p.id)}
                                    className="p-1 text-[#8C9BA8] hover:text-red-500 transition-colors cursor-pointer"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Card 2: Loans */}
                  <div className="bg-white rounded-[16px] p-6 sm:p-8 shadow-[0px_2px_12px_rgba(0,0,0,0.03)] border border-[#EDEDF0]">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-[19px] font-bold text-[#071E36] font-['Poppins',sans-serif]">
                        Loans
                      </h2>
                      <button
                        onClick={() => setIsLoanModalOpen(true)}
                        className="bg-[#071E36] hover:bg-[#122D4D] text-white h-[40px] px-[18px] rounded-[8px] text-[13.5px] font-medium flex items-center gap-[8px] transition-colors cursor-pointer shadow-xs"
                      >
                        <Plus className="w-4 h-4 stroke-[2.2]" />
                        <span>Add Loan</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[1100px]">
                        <thead>
                          <tr className="border-b border-[#F0F1F3]">
                            <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                              <div
                                onClick={() => toggleLoanSort("lender")}
                                className="flex items-center gap-1 cursor-pointer"
                              >
                                <span>Lendor</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                              </div>
                            </th>
                            <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                              <div
                                onClick={() => toggleLoanSort("loanReferences")}
                                className="flex items-center gap-1 cursor-pointer"
                              >
                                <span>Loan References</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                              </div>
                            </th>
                            <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                              <div
                                onClick={() => toggleLoanSort("tchLoan")}
                                className="flex items-center gap-1 cursor-pointer"
                              >
                                <span>TC&amp;H Loan</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                              </div>
                            </th>
                            <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                              <div
                                onClick={() => toggleLoanSort("purpose")}
                                className="flex items-center gap-1 cursor-pointer"
                              >
                                <span>Purpose</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                              </div>
                            </th>
                            <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                              <div
                                onClick={() => toggleLoanSort("repayment")}
                                className="flex items-center gap-1 cursor-pointer"
                              >
                                <span>Repayment</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                              </div>
                            </th>
                            <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                              <div
                                onClick={() => toggleLoanSort("rateType")}
                                className="flex items-center gap-1 cursor-pointer"
                              >
                                <span>Rate Type</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                              </div>
                            </th>
                            <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                              <div
                                onClick={() => toggleLoanSort("ioExpiry")}
                                className="flex items-center gap-1 cursor-pointer"
                              >
                                <span>Io Expiry</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                              </div>
                            </th>
                            <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                              <div
                                onClick={() => toggleLoanSort("fixedExpiry")}
                                className="flex items-center gap-1 cursor-pointer"
                              >
                                <span>Fixed Expiry</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                              </div>
                            </th>
                            <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                              <div
                                onClick={() => toggleLoanSort("maturity")}
                                className="flex items-center gap-1 cursor-pointer"
                              >
                                <span>Maturity</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                              </div>
                            </th>
                            <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                              <div
                                onClick={() => toggleLoanSort("security1")}
                                className="flex items-center gap-1 cursor-pointer"
                              >
                                <span>Security 1</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                              </div>
                            </th>
                            <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                              <div
                                onClick={() => toggleLoanSort("security2")}
                                className="flex items-center gap-1 cursor-pointer"
                              >
                                <span>Security 2</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                              </div>
                            </th>
                            <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                              <div
                                onClick={() => toggleLoanSort("security3")}
                                className="flex items-center gap-1 cursor-pointer"
                              >
                                <span>Security 3</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                              </div>
                            </th>
                            <th className="py-3 px-3 text-right"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F6F7F9]">
                          {sortedLoans.length === 0 ? (
                            <tr>
                              <td
                                colSpan={13}
                                className="py-6 text-center text-[13.5px] text-[#8C9BA8]"
                              >
                                No loans in database for this household. Click
                                &quot;+ Add Loan&quot; to add one.
                              </td>
                            </tr>
                          ) : (
                            sortedLoans.map((l) => (
                              <tr
                                key={l.id}
                                className="hover:bg-[#FBFBFC] transition-colors"
                              >
                                <td className="py-4 px-3 text-[13.5px] text-[#1A1C1E] font-medium">
                                  {l.lender}
                                </td>
                                <td className="py-4 px-3 text-[13.5px] text-[#1A1C1E]">
                                  {l.loanReferences}
                                </td>
                                <td className="py-4 px-3 text-[13.5px] text-[#1A1C1E]">
                                  {l.tchLoan}
                                </td>
                                <td className="py-4 px-3 text-[13.5px] text-[#1A1C1E]">
                                  {l.purpose}
                                </td>
                                <td className="py-4 px-3 text-[13.5px] text-[#1A1C1E]">
                                  {l.repayment}
                                </td>
                                <td className="py-4 px-3 text-[13.5px] text-[#1A1C1E]">
                                  {l.rateType}
                                </td>
                                <td className="py-4 px-3 text-[13.5px] text-[#1A1C1E]">
                                  {l.ioExpiry}
                                </td>
                                <td className="py-4 px-3 text-[13.5px] text-[#1A1C1E]">
                                  {l.fixedExpiry}
                                </td>
                                <td className="py-4 px-3 text-[13.5px] text-[#1A1C1E]">
                                  {l.maturity}
                                </td>
                                <td className="py-4 px-3 text-[13.5px] text-[#1A1C1E] font-medium">
                                  {l.security1}
                                </td>
                                <td className="py-4 px-3 text-[13.5px] text-[#1A1C1E]">
                                  {l.security2}
                                </td>
                                <td className="py-4 px-3 text-[13.5px] text-[#1A1C1E]">
                                  {l.security3}
                                </td>
                                <td className="py-4 px-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteLoan(l.id)}
                                    className="p-1 text-[#8C9BA8] hover:text-red-500 transition-colors cursor-pointer"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
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

              {/* ========================================================== */}
              {/* Tab 3 - Review Workspace */}
              {/* ========================================================== */}
              {activeTab === "review-workspace" && (
                <div className="bg-white rounded-[16px] p-6 sm:p-8 shadow-[0px_2px_12px_rgba(0,0,0,0.03)] border border-[#EDEDF0]">
                  <h2 className="text-[19px] font-bold text-[#071E36] mb-6 font-['Poppins',sans-serif]">
                    Review History
                  </h2>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[650px]">
                      <thead>
                        <tr className="border-b border-[#F0F1F3]">
                          <th className="py-3 px-3 font-medium text-[13.5px] text-[#8C9BA8]">
                            <div
                              onClick={() => toggleReviewSort("fy")}
                              className="flex items-center gap-1.5 cursor-pointer"
                            >
                              <span>FY</span>
                              <ChevronDown className="w-3.5 h-3.5" />
                            </div>
                          </th>
                          <th className="py-3 px-3 font-medium text-[13.5px] text-[#8C9BA8]">
                            <div
                              onClick={() => toggleReviewSort("finDataInput")}
                              className="flex items-center gap-1.5 cursor-pointer"
                            >
                              <span>Fin Data Input</span>
                              <ChevronDown className="w-3.5 h-3.5" />
                            </div>
                          </th>
                          <th className="py-3 px-3 font-medium text-[13.5px] text-[#8C9BA8]">
                            <div
                              onClick={() => toggleReviewSort("reviewStatus")}
                              className="flex items-center gap-1.5 cursor-pointer"
                            >
                              <span>Review Status</span>
                              <ChevronDown className="w-3.5 h-3.5" />
                            </div>
                          </th>
                          <th className="py-3 px-3 font-medium text-[13.5px] text-[#8C9BA8]">
                            <div
                              onClick={() => toggleReviewSort("reviewDate")}
                              className="flex items-center gap-1.5 cursor-pointer"
                            >
                              <span>Review Date</span>
                              <ChevronDown className="w-3.5 h-3.5" />
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F6F7F9]">
                        {sortedReviews.map((r) => (
                          <tr
                            key={r.id}
                            className="hover:bg-[#FBFBFC] transition-colors"
                          >
                            <td className="py-4 px-3 text-[14px] text-[#1A1C1E] font-medium">
                              {r.fy}
                            </td>
                            <td className="py-4 px-3 text-[14px]">
                              <span
                                onClick={() => setSelectedFinDataReview(r)}
                                className={`underline cursor-pointer font-medium hover:opacity-80 transition-opacity ${
                                  r.finDataInput === "Completed"
                                    ? "text-[#0B7B3E]"
                                    : "text-[#C66900]"
                                }`}
                              >
                                {r.finDataInput}
                              </span>
                            </td>
                            <td className="py-4 px-3 text-[14px]">
                              <span
                                onClick={() => setSelectedReviewStatusRow(r)}
                                className={`underline cursor-pointer font-medium hover:opacity-80 transition-opacity ${
                                  r.reviewStatus === "Completed"
                                    ? "text-[#0B7B3E]"
                                    : "text-[#C66900]"
                                }`}
                              >
                                {r.reviewStatus}
                              </span>
                            </td>
                            <td className="py-4 px-3 text-[14px] text-[#1A1C1E]">
                              {r.reviewDate}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ========================================================== */}
              {/* Tab 4 - Report */}
              {/* ========================================================== */}
              {activeTab === "report" && (
                <div className="bg-white rounded-[16px] p-6 sm:p-8 shadow-[0px_2px_12px_rgba(0,0,0,0.03)] border border-[#EDEDF0]">
                  <h2 className="text-[19px] font-bold text-[#071E36] mb-6 font-['Poppins',sans-serif]">
                    Report
                  </h2>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                      <thead>
                        <tr className="border-b border-[#F0F1F3]">
                          <th className="py-3 px-3 font-medium text-[13.5px] text-[#8C9BA8]">
                            <div
                              onClick={() => toggleReportSort("fy")}
                              className="flex items-center gap-1.5 cursor-pointer"
                            >
                              <span>FY</span>
                              <ChevronDown className="w-3.5 h-3.5" />
                            </div>
                          </th>
                          <th className="py-3 px-3 font-medium text-[13.5px] text-[#8C9BA8]">
                            <div
                              onClick={() => toggleReportSort("reportStatus")}
                              className="flex items-center gap-1.5 cursor-pointer"
                            >
                              <span>Report status</span>
                              <ChevronDown className="w-3.5 h-3.5" />
                            </div>
                          </th>
                          <th className="py-3 px-3 font-medium text-[13.5px] text-[#8C9BA8]">
                            <div
                              onClick={() => toggleReportSort("share")}
                              className="flex items-center gap-1.5 cursor-pointer"
                            >
                              <span>Share</span>
                              <ChevronDown className="w-3.5 h-3.5" />
                            </div>
                          </th>
                          <th className="py-3 px-3 font-medium text-[13.5px] text-[#8C9BA8]">
                            <div
                              onClick={() => toggleReportSort("shareDate")}
                              className="flex items-center gap-1.5 cursor-pointer"
                            >
                              <span>Share Date</span>
                              <ChevronDown className="w-3.5 h-3.5" />
                            </div>
                          </th>
                          <th className="py-3 px-3 font-medium text-[13.5px] text-[#8C9BA8]">
                            <div
                              onClick={() =>
                                toggleReportSort("complianceAcknowledged")
                              }
                              className="flex items-center gap-1.5 cursor-pointer"
                            >
                              <span>Compliance Acknowledged</span>
                              <ChevronDown className="w-3.5 h-3.5" />
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F6F7F9]">
                        {sortedReports.map((rep) => (
                          <tr
                            key={rep.id}
                            className="hover:bg-[#FBFBFC] transition-colors"
                          >
                            <td className="py-4 px-3 text-[14px] text-[#1A1C1E] font-medium">
                              {rep.fy}
                            </td>
                            <td className="py-4 px-3 text-[14px]">
                              <span
                                onClick={() =>
                                  setSelectedReviewStatusRow({
                                    id: rep.id,
                                    fy: rep.fy,
                                    finDataInput: "Completed",
                                    reviewStatus:
                                      rep.reportStatus === "Completed"
                                        ? "Completed"
                                        : "In Progress",
                                    reviewDate: rep.shareDate,
                                  })
                                }
                                className={`underline cursor-pointer font-medium ${
                                  rep.reportStatus === "Completed"
                                    ? "text-[#0B7B3E]"
                                    : rep.reportStatus === "In Progress"
                                    ? "text-[#C66900]"
                                    : "text-[#DC2626]"
                                }`}
                              >
                                {rep.reportStatus}
                              </span>
                            </td>
                            <td className="py-4 px-3 text-[14px]">
                              <span className="text-[#1A56DB] underline cursor-pointer font-medium">
                                {rep.share}
                              </span>
                            </td>
                            <td className="py-4 px-3 text-[14px] text-[#1A1C1E]">
                              {rep.shareDate}
                            </td>
                            <td className="py-4 px-3 text-[14px] text-[#1A1C1E]">
                              {rep.complianceAcknowledged}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ========================================================== */}
              {/* Tab 5 - Insights & Recommendations */}
              {/* ========================================================== */}
              {activeTab === "insights-recommendations" && (
                <div className="bg-white rounded-[16px] p-6 sm:p-8 shadow-[0px_2px_12px_rgba(0,0,0,0.03)] border border-[#EDEDF0]">
                  <h2 className="text-[19px] font-bold text-[#071E36] mb-6 font-['Poppins',sans-serif]">
                    Insights &amp; Recommendations
                  </h2>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1200px]">
                      <thead>
                        <tr className="border-b border-[#F0F1F3]">
                          <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                            <div
                              onClick={() => toggleInsightSort("fy")}
                              className="flex items-center gap-1 cursor-pointer"
                            >
                              <span>FY</span>
                              <ChevronDown className="w-3.5 h-3.5" />
                            </div>
                          </th>
                          <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                            <div
                              onClick={() => toggleInsightSort("screen")}
                              className="flex items-center gap-1 cursor-pointer"
                            >
                              <span>Screen</span>
                              <ChevronDown className="w-3.5 h-3.5" />
                            </div>
                          </th>
                          <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                            <div
                              onClick={() => toggleInsightSort("property")}
                              className="flex items-center gap-1 cursor-pointer"
                            >
                              <span>Property</span>
                              <ChevronDown className="w-3.5 h-3.5" />
                            </div>
                          </th>
                          <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                            <div
                              onClick={() =>
                                toggleInsightSort("maintenanceInsight")
                              }
                              className="flex items-center gap-1 cursor-pointer"
                            >
                              <span>Maintenance insight</span>
                              <ChevronDown className="w-3.5 h-3.5" />
                            </div>
                          </th>
                          <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                            <div
                              onClick={() => toggleInsightSort("metric")}
                              className="flex items-center gap-1 cursor-pointer"
                            >
                              <span>Metric</span>
                              <ChevronDown className="w-3.5 h-3.5" />
                            </div>
                          </th>
                          <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                            <div
                              onClick={() => toggleInsightSort("heading")}
                              className="flex items-center gap-1 cursor-pointer"
                            >
                              <span>Heading</span>
                              <ChevronDown className="w-3.5 h-3.5" />
                            </div>
                          </th>
                          <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                            <div
                              onClick={() => toggleInsightSort("insight")}
                              className="flex items-center gap-1 cursor-pointer"
                            >
                              <span>Insight</span>
                              <ChevronDown className="w-3.5 h-3.5" />
                            </div>
                          </th>
                          <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                            <div
                              onClick={() =>
                                toggleInsightSort("recommendation")
                              }
                              className="flex items-center gap-1 cursor-pointer"
                            >
                              <span>RECOMMENDATION</span>
                              <ChevronDown className="w-3.5 h-3.5" />
                            </div>
                          </th>
                          <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                            <div
                              onClick={() => toggleInsightSort("priority")}
                              className="flex items-center gap-1 cursor-pointer"
                            >
                              <span>PRIORITY</span>
                              <ChevronDown className="w-3.5 h-3.5" />
                            </div>
                          </th>
                          <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                            <div
                              onClick={() => toggleInsightSort("owner")}
                              className="flex items-center gap-1 cursor-pointer"
                            >
                              <span>Owner</span>
                              <ChevronDown className="w-3.5 h-3.5" />
                            </div>
                          </th>
                          <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                            <div
                              onClick={() => toggleInsightSort("action")}
                              className="flex items-center gap-1 cursor-pointer"
                            >
                              <span>Action</span>
                              <ChevronDown className="w-3.5 h-3.5" />
                            </div>
                          </th>
                          <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                            <div
                              onClick={() => toggleInsightSort("notes")}
                              className="flex items-center gap-1 cursor-pointer"
                            >
                              <span>Notes</span>
                              <ChevronDown className="w-3.5 h-3.5" />
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F6F7F9]">
                        {sortedInsights.length === 0 ? (
                          <tr>
                            <td
                              colSpan={12}
                              className="py-6 text-center text-[13.5px] text-[#8C9BA8]"
                            >
                              No insights recorded in database yet. Open Review
                              Workspace to add insights.
                            </td>
                          </tr>
                        ) : (
                          sortedInsights.map((item) => (
                            <tr
                              key={item.id}
                              className="hover:bg-[#FBFBFC] transition-colors"
                            >
                              <td className="py-4 px-3 text-[13.5px] text-[#1A1C1E]">
                                {item.fy}
                              </td>
                              <td className="py-4 px-3 text-[13.5px] text-[#1A1C1E] whitespace-nowrap">
                                {item.screen}
                              </td>
                              <td className="py-4 px-3 text-[13.5px] text-[#1A1C1E] font-medium whitespace-nowrap">
                                {item.property}
                              </td>
                              <td className="py-4 px-3 text-[13.5px] text-[#1A1C1E]">
                                {item.maintenanceInsight}
                              </td>
                              <td className="py-4 px-3 text-[13.5px] text-[#1A1C1E] whitespace-nowrap">
                                {item.metric}
                              </td>
                              <td className="py-4 px-3 text-[13.5px] text-[#1A1C1E] font-medium whitespace-nowrap">
                                {item.heading}
                              </td>
                              <td className="py-4 px-3 text-[13.5px] text-[#1A1C1E] whitespace-nowrap">
                                {item.insight}
                              </td>
                              <td className="py-4 px-3 text-[13.5px] text-[#1A1C1E] whitespace-nowrap">
                                {item.recommendation}
                              </td>
                              <td className="py-4 px-3 text-[13.5px] text-[#1A1C1E] font-medium">
                                {item.priority}
                              </td>
                              <td className="py-4 px-3 text-[13.5px] text-[#1A1C1E]">
                                {item.owner}
                              </td>
                              <td className="py-4 px-3 text-[13.5px] text-[#1A1C1E] whitespace-nowrap">
                                {item.action}
                              </td>
                              <td className="py-4 px-3 text-[13.5px] text-[#1A1C1E] whitespace-nowrap">
                                {item.notes}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Modals */}
      <AddEntityModal
        isOpen={isEntityModalOpen}
        onClose={() => setIsEntityModalOpen(false)}
        onAddEntity={handleAddEntity}
      />

      <AddPropertyModal
        isOpen={isPropertyModalOpen}
        onClose={() => setIsPropertyModalOpen(false)}
        onAddProperty={handleAddProperty}
      />

      <AddLoanModal
        isOpen={isLoanModalOpen}
        onClose={() => setIsLoanModalOpen(false)}
        onAddLoan={handleAddLoan}
        availableProperties={properties.map((p) => p.address)}
      />
    </div>
  );
}
