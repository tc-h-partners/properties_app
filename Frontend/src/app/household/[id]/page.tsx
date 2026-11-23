"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Plus,
  ChevronDown,
  Pencil,
  Trash2,
} from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import TopNav from "@/components/dashboard/TopNav";
import AddEntityModal from "@/components/household/AddEntityModal";
import AddPropertyModal from "@/components/household/AddPropertyModal";
import AddLoanModal from "@/components/household/AddLoanModal";
import FinancialDataInput from "@/components/household/FinancialDataInput";
import ReviewWorkspaceReport from "@/components/household/ReviewWorkspaceReport";

// 5 exact Tabs from the provided design screenshots
type HouseholdTab =
  | "client-entity"
  | "properties-loans"
  | "review-workspace"
  | "report"
  | "insights-recommendations";

// --- Tab 1: Client & Entity Types ---
interface ClientEntityRow {
  id: string;
  name: string;
  age: string;
  mobile: string;
  email: string;
  entityType: string;
}

// --- Tab 2: Property & Loan Types ---
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

// --- Tab 3: Review Workspace Types ---
interface ReviewWorkspaceRow {
  id: string;
  fy: string;
  finDataInput: "Completed" | "In Progress";
  reviewStatus: "Completed" | "In Progress";
  reviewDate: string;
}

// --- Tab 4: Report Types ---
interface ReportRow {
  id: string;
  fy: string;
  reportStatus: "Completed" | "In Progress" | "Not started";
  share: string;
  shareDate: string;
  complianceAcknowledged: string;
}

// --- Tab 5: Insights & Recommendations Types ---
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

// ==========================================
// Initial Data exactly as shown in Screenshots
// ==========================================

const INITIAL_CLIENT_ENTITIES: ClientEntityRow[] = [
  {
    id: "e1",
    name: "Victoria Harrison (Primary)",
    age: "32",
    mobile: "+61 412 890 231",
    email: "ethan.h@student.edu.au",
    entityType: "Individual",
  },
  {
    id: "e2",
    name: "Oliver Harrison",
    age: "35",
    mobile: "+61 412 890 231",
    email: "ethan.h@student.edu.au",
    entityType: "Individual",
  },
  {
    id: "e3",
    name: "Harrison pvt",
    age: "---",
    mobile: "+61 412 890 231",
    email: "ethan.h@student.edu.au",
    entityType: "Company",
  },
  {
    id: "e4",
    name: "Harrison Family Trust",
    age: "---",
    mobile: "+61 412 890 231",
    email: "ethan.h@student.edu.au",
    entityType: "Trust",
  },
  {
    id: "e5",
    name: "Jack Harrison",
    age: "47",
    mobile: "+61 412 890 231",
    email: "ethan.h@student.edu.au",
    entityType: "Individual",
  },
];

const INITIAL_PROPERTIES: PropertyRow[] = [
  {
    id: "p1",
    address: "48 Underwood Street, Paddington NSW 2021",
    type: "House",
    purpose: "Investment",
    purchaseDate: "24/10/2026",
    purchasePrice: "$80,0000",
    purchaseCost: "$45,936",
    size: "600",
    beds: 6,
    baths: 6,
    cars: 2,
    owner1: "Smith john",
    owner1Pct: "100%",
    owner2: "----",
    owner2Pct: "---",
  },
  {
    id: "p2",
    address: "48 Underwood Street, Paddington NSW 2021",
    type: "Unit",
    purpose: "Investment",
    purchaseDate: "24/10/2026",
    purchasePrice: "$80,0000",
    purchaseCost: "$45,936",
    size: "--",
    beds: 5,
    baths: 5,
    cars: 3,
    owner1: "David miller",
    owner1Pct: "50%",
    owner2: "Michal",
    owner2Pct: "50%",
  },
];

const INITIAL_LOANS: LoanRow[] = [
  {
    id: "l1",
    lender: "ANZ",
    loanReferences: "ANZ1477642",
    tchLoan: "yes",
    purpose: "Investment",
    repayment: "Interest only",
    rateType: "Variable",
    ioExpiry: "24/10/2026",
    fixedExpiry: "----",
    maturity: "24/10/2026",
    security1: "123 smit st buddha",
    security2: "----",
    security3: "----",
  },
  {
    id: "l2",
    lender: "CBA",
    loanReferences: "CBA124523",
    tchLoan: "No",
    purpose: "Investment",
    repayment: "Principal Interest",
    rateType: "Variable",
    ioExpiry: "----",
    fixedExpiry: "24/10/2026",
    maturity: "24/10/2026",
    security1: "45 Johan st",
    security2: "----",
    security3: "----",
  },
];

const INITIAL_REVIEWS: ReviewWorkspaceRow[] = [
  {
    id: "r1",
    fy: "2023",
    finDataInput: "Completed",
    reviewStatus: "Completed",
    reviewDate: "24/10/2026",
  },
  {
    id: "r2",
    fy: "2024",
    finDataInput: "Completed",
    reviewStatus: "In Progress",
    reviewDate: "18 / 8/ 2025",
  },
  {
    id: "r3",
    fy: "2025",
    finDataInput: "In Progress",
    reviewStatus: "In Progress",
    reviewDate: "18 / 8/ 2025",
  },
];

const INITIAL_REPORTS: ReportRow[] = [
  {
    id: "rep1",
    fy: "2023",
    reportStatus: "Completed",
    share: "Lunch",
    shareDate: "24/10/2026",
    complianceAcknowledged: "-",
  },
  {
    id: "rep2",
    fy: "2024",
    reportStatus: "In Progress",
    share: "Lunch",
    shareDate: "18 / 8/ 2025",
    complianceAcknowledged: "-",
  },
  {
    id: "rep3",
    fy: "2025",
    reportStatus: "Not started",
    share: "Lunch",
    shareDate: "18 / 8/ 2025",
    complianceAcknowledged: "-",
  },
];

const INITIAL_INSIGHTS: InsightRecommendationRow[] = [
  {
    id: "ir1",
    fy: "2023",
    screen: "Property Overview",
    property: "7 Kawana Way",
    maintenanceInsight: "-",
    metric: "Total property return",
    heading: "Increase Rent",
    insight: "Rent is $80 below market",
    recommendation: "Review rent at next opportunity",
    priority: "Medium",
    owner: "Sahil",
    action: "Review rental income",
    notes: "Check benchmark",
  },
  {
    id: "ir2",
    fy: "2024",
    screen: "Property Overview",
    property: "7 Kawana Way",
    maintenanceInsight: "-",
    metric: "Total property return",
    heading: "Increase Rent",
    insight: "Rent is $80 below market",
    recommendation: "18 / 8/ 2025",
    priority: "Medium",
    owner: "Sahil",
    action: "No action required",
    notes: "Continue monitor",
  },
];

// Universal sorting algorithm supporting strings, numbers, currencies, and dates
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

    // Check numbers/currencies/percentages
    const cleanA = String(valA).replace(/[\$,]/g, "").replace(/%$/, "").trim();
    const cleanB = String(valB).replace(/[\$,]/g, "").replace(/%$/, "").trim();

    if (!isNaN(Number(cleanA)) && !isNaN(Number(cleanB))) {
      return dir === "asc"
        ? Number(cleanA) - Number(cleanB)
        : Number(cleanB) - Number(cleanA);
    }

    // Check dates (e.g. 24/10/2026 or 18 / 8/ 2025 or 27-10-26)
    const dateMatchA = String(valA).match(/^(\d{1,2})[\/\s-]+(\d{1,2})[\/\s-]+(\d{2,4})$/);
    const dateMatchB = String(valB).match(/^(\d{1,2})[\/\s-]+(\d{1,2})[\/\s-]+(\d{2,4})$/);
    if (dateMatchA && dateMatchB) {
      const yearA = dateMatchA[3].length === 2 ? `20${dateMatchA[3]}` : dateMatchA[3];
      const yearB = dateMatchB[3].length === 2 ? `20${dateMatchB[3]}` : dateMatchB[3];
      const timeA = new Date(
        `${yearA}-${dateMatchA[2].padStart(2, "0")}-${dateMatchA[1].padStart(2, "0")}`
      ).getTime();
      const timeB = new Date(
        `${yearB}-${dateMatchB[2].padStart(2, "0")}-${dateMatchB[1].padStart(2, "0")}`
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
  const rawId = (params?.id as string) || "harrison-family";

  // Derive household title
  const householdName = useMemo(() => {
    if (rawId === "harrison-family") return "Harrison Family";
    return rawId
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }, [rawId]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<HouseholdTab>("client-entity");
  const [selectedFinDataReview, setSelectedFinDataReview] = useState<ReviewWorkspaceRow | null>(null);
  const [selectedReviewStatusRow, setSelectedReviewStatusRow] = useState<ReviewWorkspaceRow | null>(null);

  // State
  const [entities, setEntities] = useState<ClientEntityRow[]>(INITIAL_CLIENT_ENTITIES);
  const [properties, setProperties] = useState<PropertyRow[]>(INITIAL_PROPERTIES);
  const [loans, setLoans] = useState<LoanRow[]>(INITIAL_LOANS);
  const [reviews] = useState<ReviewWorkspaceRow[]>(INITIAL_REVIEWS);
  const [reports] = useState<ReportRow[]>(INITIAL_REPORTS);
  const [insights] = useState<InsightRecommendationRow[]>(INITIAL_INSIGHTS);

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
  const sortedLoans = useMemo(() => sortTableData(loans, loanSort), [loans, loanSort]);
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

  // Dynamic Super-Title & Title matching screenshot 1-3 vs 4-5
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

  // Modal Handlers
  const handleAddEntity = (newE: {
    name: string;
    type: string;
    abn: string;
    email: string;
    phone: string;
    regDate: string;
  }) => {
    const item: ClientEntityRow = {
      id: `e-${Date.now()}`,
      name: newE.name,
      age: newE.regDate || "---",
      mobile: newE.phone || "+61 412 890 231",
      email: newE.email || "ethan.h@student.edu.au",
      entityType: newE.type,
    };
    setEntities((prev) => [...prev, item]);
  };

  const handleAddProperty = (p: {
    address: string;
    state: string;
    postcode: string;
    type: string;
    purpose: string;
    purchasePrice: string;
    currentValue: string;
    rentWeekly: string;
    entity: string;
  }) => {
    const newProp: PropertyRow = {
      id: `p-${Date.now()}`,
      address: `${p.address}, ${p.state} ${p.postcode}`,
      type: p.type,
      purpose: p.purpose,
      purchaseDate: "24/10/2026",
      purchasePrice: p.purchasePrice.startsWith("$") ? p.purchasePrice : `$${p.purchasePrice}`,
      purchaseCost: "$45,936",
      size: "600",
      beds: 4,
      baths: 3,
      cars: 2,
      owner1: p.entity,
      owner1Pct: "100%",
      owner2: "----",
      owner2Pct: "---",
    };
    setProperties((prev) => [...prev, newProp]);
  };

  const handleAddLoan = (l: {
    lender: string;
    property: string;
    loanType: string;
    rate: string;
    balance: string;
    repaymentType: string;
    offsetBalance: string;
    isTchLoan: boolean;
  }) => {
    const newLoan: LoanRow = {
      id: `l-${Date.now()}`,
      lender: l.lender,
      loanReferences: `${l.lender.slice(0, 3).toUpperCase()}${Math.floor(
        100000 + Math.random() * 900000
      )}`,
      tchLoan: l.isTchLoan ? "yes" : "No",
      purpose: "Investment",
      repayment: l.repaymentType,
      rateType: l.loanType,
      ioExpiry: "24/10/2026",
      fixedExpiry: "----",
      maturity: "24/10/2026",
      security1: l.property,
      security2: "----",
      security3: "----",
    };
    setLoans((prev) => [...prev, newLoan]);
  };

  const handleDeleteProperty = (id: string) => {
    setProperties((prev) => prev.filter((p) => p.id !== id));
  };

  const handleDeleteLoan = (id: string) => {
    setLoans((prev) => prev.filter((l) => l.id !== id));
  };

  return (
    <div className="h-screen w-full bg-[#FBFBFC] flex overflow-hidden select-none font-['Inter',sans-serif]">
      {/* Sidebar - fixed on left */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeSubItemLabel={
          selectedReviewStatusRow
            ? "Harrison Family -\nReview Workspace"
            : undefined
        }
      />

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
        />
      )}

      {/* Main Content Area - independent scrollable section with sticky header */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto min-w-0">
        <TopNav onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 p-6 sm:p-9 max-w-[1440px] w-full mx-auto">
          {selectedFinDataReview ? (
            <FinancialDataInput
              year={selectedFinDataReview.fy}
              status={selectedFinDataReview.finDataInput}
              householdName="Harrison family"
              onBackToWorkspace={() => setSelectedFinDataReview(null)}
            />
          ) : selectedReviewStatusRow ? (
            <ReviewWorkspaceReport
              householdName={householdName}
              reviewYear={selectedReviewStatusRow.fy}
              reviewStatus={selectedReviewStatusRow.reviewStatus}
              onBack={() => setSelectedReviewStatusRow(null)}
            />
          ) : (
            <>
              {/* Super-title / Breadcrumb exactly as shown in Screenshots */}
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

              {/* Tab Navigation Pill Container matching screenshots */}
              <div className="bg-[#F2F1F3] p-[4px] rounded-[10px] inline-flex items-center gap-[4px] mb-8 max-w-full overflow-x-auto">
                {[
                  { id: "client-entity" as HouseholdTab, label: "Client & Entity Setup" },
                  { id: "properties-loans" as HouseholdTab, label: "Properties & Loans Setup" },
                  { id: "review-workspace" as HouseholdTab, label: "Review Workspace" },
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
          {/* SCREENSHOT 1: Tab 1 - Client & Entity Setup */}
          {/* ========================================================== */}
          {activeTab === "client-entity" && (
            <div className="relative">
              {/* + Add Client / Entity button positioned top right */}
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setIsEntityModalOpen(true)}
                  className="bg-[#071E36] hover:bg-[#122D4D] text-white h-[42px] px-[18px] rounded-[8px] text-[13.5px] font-medium flex items-center gap-[9px] transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4 stroke-[2.2]" />
                  <span>Add Client / Entity</span>
                </button>
              </div>

              {/* White Container Card */}
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
                              entitySort?.field === "name" && entitySort.dir === "desc"
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
                              entitySort?.field === "age" && entitySort.dir === "desc"
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
                              entitySort?.field === "mobile" && entitySort.dir === "desc"
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
                              entitySort?.field === "email" && entitySort.dir === "desc"
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
                              entitySort?.field === "entityType" && entitySort.dir === "desc"
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
                    {sortedEntities.map((row) => (
                      <tr key={row.id} className="hover:bg-[#FBFBFC] transition-colors">
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
                            className="p-1 text-[#8C9BA8] hover:text-[#071E36] transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* SCREENSHOT 2: Tab 2 - Properties & Loans Setup */}
          {/* ========================================================== */}
          {activeTab === "properties-loans" && (
            <div className="space-y-8">
              {/* Card 1: Properties */}
              <div className="bg-white rounded-[16px] p-6 sm:p-8 shadow-[0px_2px_12px_rgba(0,0,0,0.03)] border border-[#EDEDF0]">
                {/* Header inside Card */}
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

                {/* Table */}
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
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform ${
                                propertySort?.field === "address" && propertySort.dir === "desc"
                                  ? "rotate-180"
                                  : ""
                              }`}
                            />
                          </div>
                        </th>
                        <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                          <div
                            onClick={() => togglePropertySort("type")}
                            className="flex items-center gap-1 cursor-pointer"
                          >
                            <span>Type</span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform ${
                                propertySort?.field === "type" && propertySort.dir === "desc"
                                  ? "rotate-180"
                                  : ""
                              }`}
                            />
                          </div>
                        </th>
                        <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                          <div
                            onClick={() => togglePropertySort("purpose")}
                            className="flex items-center gap-1 cursor-pointer"
                          >
                            <span>Purpose</span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform ${
                                propertySort?.field === "purpose" && propertySort.dir === "desc"
                                  ? "rotate-180"
                                  : ""
                              }`}
                            />
                          </div>
                        </th>
                        <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                          <div
                            onClick={() => togglePropertySort("purchaseDate")}
                            className="flex items-center gap-1 cursor-pointer"
                          >
                            <span>Purchase Date</span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform ${
                                propertySort?.field === "purchaseDate" &&
                                propertySort.dir === "desc"
                                  ? "rotate-180"
                                  : ""
                              }`}
                            />
                          </div>
                        </th>
                        <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                          <div
                            onClick={() => togglePropertySort("purchasePrice")}
                            className="flex items-center gap-1 cursor-pointer"
                          >
                            <span>Purchase price</span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform ${
                                propertySort?.field === "purchasePrice" &&
                                propertySort.dir === "desc"
                                  ? "rotate-180"
                                  : ""
                              }`}
                            />
                          </div>
                        </th>
                        <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                          <div
                            onClick={() => togglePropertySort("purchaseCost")}
                            className="flex items-center gap-1 cursor-pointer"
                          >
                            <span>Purchase Cost</span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform ${
                                propertySort?.field === "purchaseCost" &&
                                propertySort.dir === "desc"
                                  ? "rotate-180"
                                  : ""
                              }`}
                            />
                          </div>
                        </th>
                        <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                          <div
                            onClick={() => togglePropertySort("size")}
                            className="flex items-center gap-1 cursor-pointer"
                          >
                            <span>Size</span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform ${
                                propertySort?.field === "size" && propertySort.dir === "desc"
                                  ? "rotate-180"
                                  : ""
                              }`}
                            />
                          </div>
                        </th>
                        <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                          <div
                            onClick={() => togglePropertySort("beds")}
                            className="flex items-center gap-1 cursor-pointer"
                          >
                            <span>Beds</span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform ${
                                propertySort?.field === "beds" && propertySort.dir === "desc"
                                  ? "rotate-180"
                                  : ""
                              }`}
                            />
                          </div>
                        </th>
                        <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                          <div
                            onClick={() => togglePropertySort("baths")}
                            className="flex items-center gap-1 cursor-pointer"
                          >
                            <span>Baths</span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform ${
                                propertySort?.field === "baths" && propertySort.dir === "desc"
                                  ? "rotate-180"
                                  : ""
                              }`}
                            />
                          </div>
                        </th>
                        <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                          <div
                            onClick={() => togglePropertySort("cars")}
                            className="flex items-center gap-1 cursor-pointer"
                          >
                            <span>Cars</span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform ${
                                propertySort?.field === "cars" && propertySort.dir === "desc"
                                  ? "rotate-180"
                                  : ""
                              }`}
                            />
                          </div>
                        </th>
                        <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                          <div
                            onClick={() => togglePropertySort("owner1")}
                            className="flex items-center gap-1 cursor-pointer"
                          >
                            <span>Owner 1</span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform ${
                                propertySort?.field === "owner1" && propertySort.dir === "desc"
                                  ? "rotate-180"
                                  : ""
                              }`}
                            />
                          </div>
                        </th>
                        <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                          <div
                            onClick={() => togglePropertySort("owner1Pct")}
                            className="flex items-center gap-1 cursor-pointer"
                          >
                            <span>%</span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform ${
                                propertySort?.field === "owner1Pct" &&
                                propertySort.dir === "desc"
                                  ? "rotate-180"
                                  : ""
                              }`}
                            />
                          </div>
                        </th>
                        <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                          <div
                            onClick={() => togglePropertySort("owner2")}
                            className="flex items-center gap-1 cursor-pointer"
                          >
                            <span>Owner 2</span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform ${
                                propertySort?.field === "owner2" && propertySort.dir === "desc"
                                  ? "rotate-180"
                                  : ""
                              }`}
                            />
                          </div>
                        </th>
                        <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                          <div
                            onClick={() => togglePropertySort("owner2Pct")}
                            className="flex items-center gap-1 cursor-pointer"
                          >
                            <span>%</span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform ${
                                propertySort?.field === "owner2Pct" &&
                                propertySort.dir === "desc"
                                  ? "rotate-180"
                                  : ""
                              }`}
                            />
                          </div>
                        </th>
                        <th className="py-3 px-3 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F6F7F9]">
                      {sortedProperties.map((p) => (
                        <tr key={p.id} className="hover:bg-[#FBFBFC] transition-colors">
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
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Card 2: Loans */}
              <div className="bg-white rounded-[16px] p-6 sm:p-8 shadow-[0px_2px_12px_rgba(0,0,0,0.03)] border border-[#EDEDF0]">
                {/* Header inside Card */}
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

                {/* Table */}
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
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform ${
                                loanSort?.field === "lender" && loanSort.dir === "desc"
                                  ? "rotate-180"
                                  : ""
                              }`}
                            />
                          </div>
                        </th>
                        <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                          <div
                            onClick={() => toggleLoanSort("loanReferences")}
                            className="flex items-center gap-1 cursor-pointer"
                          >
                            <span>Loan References</span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform ${
                                loanSort?.field === "loanReferences" && loanSort.dir === "desc"
                                  ? "rotate-180"
                                  : ""
                              }`}
                            />
                          </div>
                        </th>
                        <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                          <div
                            onClick={() => toggleLoanSort("tchLoan")}
                            className="flex items-center gap-1 cursor-pointer"
                          >
                            <span>TC&H Loan</span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform ${
                                loanSort?.field === "tchLoan" && loanSort.dir === "desc"
                                  ? "rotate-180"
                                  : ""
                              }`}
                            />
                          </div>
                        </th>
                        <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                          <div
                            onClick={() => toggleLoanSort("purpose")}
                            className="flex items-center gap-1 cursor-pointer"
                          >
                            <span>Purpose</span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform ${
                                loanSort?.field === "purpose" && loanSort.dir === "desc"
                                  ? "rotate-180"
                                  : ""
                              }`}
                            />
                          </div>
                        </th>
                        <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                          <div
                            onClick={() => toggleLoanSort("repayment")}
                            className="flex items-center gap-1 cursor-pointer"
                          >
                            <span>Repayment</span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform ${
                                loanSort?.field === "repayment" && loanSort.dir === "desc"
                                  ? "rotate-180"
                                  : ""
                              }`}
                            />
                          </div>
                        </th>
                        <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                          <div
                            onClick={() => toggleLoanSort("rateType")}
                            className="flex items-center gap-1 cursor-pointer"
                          >
                            <span>Rate Type</span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform ${
                                loanSort?.field === "rateType" && loanSort.dir === "desc"
                                  ? "rotate-180"
                                  : ""
                              }`}
                            />
                          </div>
                        </th>
                        <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                          <div
                            onClick={() => toggleLoanSort("ioExpiry")}
                            className="flex items-center gap-1 cursor-pointer"
                          >
                            <span>Io Expiry</span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform ${
                                loanSort?.field === "ioExpiry" && loanSort.dir === "desc"
                                  ? "rotate-180"
                                  : ""
                              }`}
                            />
                          </div>
                        </th>
                        <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                          <div
                            onClick={() => toggleLoanSort("fixedExpiry")}
                            className="flex items-center gap-1 cursor-pointer"
                          >
                            <span>Fixed Expiry</span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform ${
                                loanSort?.field === "fixedExpiry" && loanSort.dir === "desc"
                                  ? "rotate-180"
                                  : ""
                              }`}
                            />
                          </div>
                        </th>
                        <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                          <div
                            onClick={() => toggleLoanSort("maturity")}
                            className="flex items-center gap-1 cursor-pointer"
                          >
                            <span>Maturity</span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform ${
                                loanSort?.field === "maturity" && loanSort.dir === "desc"
                                  ? "rotate-180"
                                  : ""
                              }`}
                            />
                          </div>
                        </th>
                        <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                          <div
                            onClick={() => toggleLoanSort("security1")}
                            className="flex items-center gap-1 cursor-pointer"
                          >
                            <span>Security 1</span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform ${
                                loanSort?.field === "security1" && loanSort.dir === "desc"
                                  ? "rotate-180"
                                  : ""
                              }`}
                            />
                          </div>
                        </th>
                        <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                          <div
                            onClick={() => toggleLoanSort("security2")}
                            className="flex items-center gap-1 cursor-pointer"
                          >
                            <span>Security 2</span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform ${
                                loanSort?.field === "security2" && loanSort.dir === "desc"
                                  ? "rotate-180"
                                  : ""
                              }`}
                            />
                          </div>
                        </th>
                        <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                          <div
                            onClick={() => toggleLoanSort("security3")}
                            className="flex items-center gap-1 cursor-pointer"
                          >
                            <span>Security 3</span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform ${
                                loanSort?.field === "security3" && loanSort.dir === "desc"
                                  ? "rotate-180"
                                  : ""
                              }`}
                            />
                          </div>
                        </th>
                        <th className="py-3 px-3 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F6F7F9]">
                      {sortedLoans.map((l) => (
                        <tr key={l.id} className="hover:bg-[#FBFBFC] transition-colors">
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
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* SCREENSHOT 3: Tab 3 - Review Workspace */}
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
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform ${
                              reviewSort?.field === "fy" && reviewSort.dir === "desc"
                                ? "rotate-180"
                                : ""
                            }`}
                          />
                        </div>
                      </th>
                      <th className="py-3 px-3 font-medium text-[13.5px] text-[#8C9BA8]">
                        <div
                          onClick={() => toggleReviewSort("finDataInput")}
                          className="flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>Fin Data Input</span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform ${
                              reviewSort?.field === "finDataInput" &&
                              reviewSort.dir === "desc"
                                ? "rotate-180"
                                : ""
                            }`}
                          />
                        </div>
                      </th>
                      <th className="py-3 px-3 font-medium text-[13.5px] text-[#8C9BA8]">
                        <div
                          onClick={() => toggleReviewSort("reviewStatus")}
                          className="flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>Review Status</span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform ${
                              reviewSort?.field === "reviewStatus" &&
                              reviewSort.dir === "desc"
                                ? "rotate-180"
                                : ""
                            }`}
                          />
                        </div>
                      </th>
                      <th className="py-3 px-3 font-medium text-[13.5px] text-[#8C9BA8]">
                        <div
                          onClick={() => toggleReviewSort("reviewDate")}
                          className="flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>Review Date</span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform ${
                              reviewSort?.field === "reviewDate" && reviewSort.dir === "desc"
                                ? "rotate-180"
                                : ""
                            }`}
                          />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F6F7F9]">
                    {sortedReviews.map((r) => (
                      <tr key={r.id} className="hover:bg-[#FBFBFC] transition-colors">
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
          {/* SCREENSHOT 4: Tab 4 - Report */}
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
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform ${
                              reportSort?.field === "fy" && reportSort.dir === "desc"
                                ? "rotate-180"
                                : ""
                            }`}
                          />
                        </div>
                      </th>
                      <th className="py-3 px-3 font-medium text-[13.5px] text-[#8C9BA8]">
                        <div
                          onClick={() => toggleReportSort("reportStatus")}
                          className="flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>Report status</span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform ${
                              reportSort?.field === "reportStatus" &&
                              reportSort.dir === "desc"
                                ? "rotate-180"
                                : ""
                            }`}
                          />
                        </div>
                      </th>
                      <th className="py-3 px-3 font-medium text-[13.5px] text-[#8C9BA8]">
                        <div
                          onClick={() => toggleReportSort("share")}
                          className="flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>Share</span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform ${
                              reportSort?.field === "share" && reportSort.dir === "desc"
                                ? "rotate-180"
                                : ""
                            }`}
                          />
                        </div>
                      </th>
                      <th className="py-3 px-3 font-medium text-[13.5px] text-[#8C9BA8]">
                        <div
                          onClick={() => toggleReportSort("shareDate")}
                          className="flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>Share Date</span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform ${
                              reportSort?.field === "shareDate" &&
                              reportSort.dir === "desc"
                                ? "rotate-180"
                                : ""
                            }`}
                          />
                        </div>
                      </th>
                      <th className="py-3 px-3 font-medium text-[13.5px] text-[#8C9BA8]">
                        <div
                          onClick={() => toggleReportSort("complianceAcknowledged")}
                          className="flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>Compliance Acknowledged</span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform ${
                              reportSort?.field === "complianceAcknowledged" &&
                              reportSort.dir === "desc"
                                ? "rotate-180"
                                : ""
                            }`}
                          />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F6F7F9]">
                    {sortedReports.map((rep) => (
                      <tr key={rep.id} className="hover:bg-[#FBFBFC] transition-colors">
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
          {/* SCREENSHOT 5: Tab 5 - Insights & Recommendations */}
          {/* ========================================================== */}
          {activeTab === "insights-recommendations" && (
            <div className="bg-white rounded-[16px] p-6 sm:p-8 shadow-[0px_2px_12px_rgba(0,0,0,0.03)] border border-[#EDEDF0]">
              <h2 className="text-[19px] font-bold text-[#071E36] mb-6 font-['Poppins',sans-serif]">
                Insights & Recommendations
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
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform ${
                              insightSort?.field === "fy" && insightSort.dir === "desc"
                                ? "rotate-180"
                                : ""
                            }`}
                          />
                        </div>
                      </th>
                      <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                        <div
                          onClick={() => toggleInsightSort("screen")}
                          className="flex items-center gap-1 cursor-pointer"
                        >
                          <span>Screen</span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform ${
                              insightSort?.field === "screen" && insightSort.dir === "desc"
                                ? "rotate-180"
                                : ""
                            }`}
                          />
                        </div>
                      </th>
                      <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                        <div
                          onClick={() => toggleInsightSort("property")}
                          className="flex items-center gap-1 cursor-pointer"
                        >
                          <span>Property</span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform ${
                              insightSort?.field === "property" && insightSort.dir === "desc"
                                ? "rotate-180"
                                : ""
                            }`}
                          />
                        </div>
                      </th>
                      <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                        <div
                          onClick={() => toggleInsightSort("maintenanceInsight")}
                          className="flex items-center gap-1 cursor-pointer"
                        >
                          <span>Maintenance insight</span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform ${
                              insightSort?.field === "maintenanceInsight" &&
                              insightSort.dir === "desc"
                                ? "rotate-180"
                                : ""
                            }`}
                          />
                        </div>
                      </th>
                      <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                        <div
                          onClick={() => toggleInsightSort("metric")}
                          className="flex items-center gap-1 cursor-pointer"
                        >
                          <span>Metric</span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform ${
                              insightSort?.field === "metric" && insightSort.dir === "desc"
                                ? "rotate-180"
                                : ""
                            }`}
                          />
                        </div>
                      </th>
                      <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                        <div
                          onClick={() => toggleInsightSort("heading")}
                          className="flex items-center gap-1 cursor-pointer"
                        >
                          <span>Heading</span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform ${
                              insightSort?.field === "heading" && insightSort.dir === "desc"
                                ? "rotate-180"
                                : ""
                            }`}
                          />
                        </div>
                      </th>
                      <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                        <div
                          onClick={() => toggleInsightSort("insight")}
                          className="flex items-center gap-1 cursor-pointer"
                        >
                          <span>Insight</span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform ${
                              insightSort?.field === "insight" && insightSort.dir === "desc"
                                ? "rotate-180"
                                : ""
                            }`}
                          />
                        </div>
                      </th>
                      <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                        <div
                          onClick={() => toggleInsightSort("recommendation")}
                          className="flex items-center gap-1 cursor-pointer"
                        >
                          <span>RECOMMENDATION</span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform ${
                              insightSort?.field === "recommendation" &&
                              insightSort.dir === "desc"
                                ? "rotate-180"
                                : ""
                            }`}
                          />
                        </div>
                      </th>
                      <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                        <div
                          onClick={() => toggleInsightSort("priority")}
                          className="flex items-center gap-1 cursor-pointer"
                        >
                          <span>PRIORITY</span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform ${
                              insightSort?.field === "priority" && insightSort.dir === "desc"
                                ? "rotate-180"
                                : ""
                            }`}
                          />
                        </div>
                      </th>
                      <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                        <div
                          onClick={() => toggleInsightSort("owner")}
                          className="flex items-center gap-1 cursor-pointer"
                        >
                          <span>Owner</span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform ${
                              insightSort?.field === "owner" && insightSort.dir === "desc"
                                ? "rotate-180"
                                : ""
                            }`}
                          />
                        </div>
                      </th>
                      <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                        <div
                          onClick={() => toggleInsightSort("action")}
                          className="flex items-center gap-1 cursor-pointer"
                        >
                          <span>Action</span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform ${
                              insightSort?.field === "action" && insightSort.dir === "desc"
                                ? "rotate-180"
                                : ""
                            }`}
                          />
                        </div>
                      </th>
                      <th className="py-3 px-3 font-medium text-[13px] text-[#8C9BA8]">
                        <div
                          onClick={() => toggleInsightSort("notes")}
                          className="flex items-center gap-1 cursor-pointer"
                        >
                          <span>Notes</span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform ${
                              insightSort?.field === "notes" && insightSort.dir === "desc"
                                ? "rotate-180"
                                : ""
                            }`}
                          />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F6F7F9]">
                    {sortedInsights.map((item) => (
                      <tr key={item.id} className="hover:bg-[#FBFBFC] transition-colors">
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
                    ))}
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
      />
    </div>
  );
}
