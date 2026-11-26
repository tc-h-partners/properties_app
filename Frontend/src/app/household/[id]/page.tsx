"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { Plus, ChevronDown, Trash2, Pencil, X, Calendar } from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import TopNav from "@/components/dashboard/TopNav";
import AddEntityModal, {
  EntityFormData,
} from "@/components/household/AddEntityModal";
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
  updateEntityApi,
  deleteEntityApi,
  createPropertyApi,
  updatePropertyApi,
  deletePropertyApi,
  createLoanApi,
  updateLoanApi,
  deleteLoanApi,
  createReviewApi,
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
  rawDate?: string;
  mobile: string;
  email: string;
  entityType: string;
  category?: "Entity" | "Investment";
  abn?: string;
  rawType?: string;
}

interface PropertyRow {
  id: string;
  address: string;
  state: string;
  postcode: string;
  type: string;
  purpose: string;
  purchaseDate: string;
  purchasePrice: string;
  rawPurchasePrice?: string;
  purchaseCost: string;
  rawPurchaseCost?: string;
  livingArea: string;
  rawLivingArea?: string;
  size: string;
  beds: number;
  baths: number;
  cars: number;
  owner1: string;
  owner1Pct: string;
  owner2: string;
  owner2Pct: string;
  additionalPersons?: any[];
}

interface LoanRow {
  id: string;
  lender: string;
  loanReferences: string;
  tchLoan: "yes" | "No";
  loanAmount: string;
  rawLoanAmount?: string;
  balance?: string;
  purpose: string;
  repayment: string;
  rateType: string;
  rate?: string;
  offsetBalance?: string;
  settlementDate: string;
  rawSettlementDate?: string;
  ioExpiry: string;
  fixedExpiry: string;
  maturity: string;
  security1: string;
  security2: string;
  security3: string;
  additionalSecurities?: string[];
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
  reportStatus: "Available" | "Not Available" | string;
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

export function calculateAge(dobOrRegStr?: string | null): string {
  if (!dobOrRegStr || dobOrRegStr === "---" || dobOrRegStr === "-") return "-";
  const trimmed = String(dobOrRegStr).trim().replace(/^["']|["']$/g, "").trim();

  // If already a plain number like "34", return it
  if (/^\d{1,3}$/.test(trimmed)) {
    return trimmed;
  }

  let birthDate: Date | null = null;

  // Australian format DD/MM/YYYY or D/M/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmyMatch = trimmed.match(
    /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})(?:\s.*)?$/
  );
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    birthDate = new Date(year, month, day);
  } else {
    // 2-digit year format DD/MM/YY or D/M/YY
    const dmy2Match = trimmed.match(
      /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})(?:\s.*)?$/
    );
    if (dmy2Match) {
      const day = parseInt(dmy2Match[1], 10);
      const month = parseInt(dmy2Match[2], 10) - 1;
      let yr = parseInt(dmy2Match[3], 10);
      yr += yr > 30 ? 1900 : 2000;
      birthDate = new Date(yr, month, day);
    } else {
      // ISO format YYYY-MM-DD or YYYY/MM/DD
      const ymdMatch = trimmed.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
      if (ymdMatch) {
        const year = parseInt(ymdMatch[1], 10);
        const month = parseInt(ymdMatch[2], 10) - 1;
        const day = parseInt(ymdMatch[3], 10);
        birthDate = new Date(year, month, day);
      } else {
        const parsed = new Date(trimmed);
        if (!isNaN(parsed.getTime())) {
          birthDate = parsed;
        }
      }
    }
  }

  if (!birthDate || isNaN(birthDate.getTime())) {
    return "-";
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age >= 0 ? String(age) : "-";
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
  const [isReportReadOnly, setIsReportReadOnly] = useState<boolean>(false);

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
        ? h.entities.map((e: any) => {
          const isInvestment =
            String(e.displayType || "").startsWith("Investment") ||
            String(e.type || "").startsWith("INVESTMENT");
          const cleanType = (e.displayType || e.type || "Discretionary Trust")
            .replace(/^Investment \(/i, "")
            .replace(/\)$/, "");

          return {
            id: e.id,
            name: e.name,
            age: calculateAge(e.ageOrDob),
            rawDate: e.ageOrDob || "",
            mobile: e.phone || "-",
            email: e.email || "-",
            entityType: e.displayType || e.type || "Individual",
            category: isInvestment ? ("Investment" as const) : ("Entity" as const),
            abn:
              e.abnOrTfnMasked && e.abnOrTfnMasked !== "-"
                ? e.abnOrTfnMasked
                : "",
            rawType: cleanType,
          };
        })
        : [];
      setEntities(dbEntities);

      // Map Properties from DB
      const dbProps: PropertyRow[] = Array.isArray(h.properties)
        ? h.properties.map((p: any) => {
          const ownersObj =
            typeof p.ownersJson === "object" && p.ownersJson !== null
              ? p.ownersJson
              : {};
          const livingAreaVal =
            ownersObj.livingArea ||
            (typeof p.detailsJson === "object" && p.detailsJson?.livingArea) ||
            "";
          const addPersons = Array.isArray(ownersObj.additionalPersons)
            ? ownersObj.additionalPersons
            : [];
          return {
            id: p.id,
            address: p.address,
            state: p.state || "",
            postcode: p.postcode || "",
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
            rawPurchasePrice: String(p.purchasePrice ?? ""),
            purchaseCost: formatMoney(p.acquisitionCosts ?? 45936),
            rawPurchaseCost: String(p.acquisitionCosts ?? ""),
            livingArea: livingAreaVal ? String(livingAreaVal) : "-",
            rawLivingArea: livingAreaVal ? String(livingAreaVal) : "",
            size: p.landSize || "600",
            beds: Number(p.beds ?? 4),
            baths: Number(p.baths ?? 2),
            cars: Number(p.cars ?? 2),
            owner1: p.owner1 || p.entity?.name || "Primary Owner",
            owner1Pct: p.owner1Pct || "100%",
            owner2: p.owner2 || "----",
            owner2Pct: p.owner2Pct || "---",
            additionalPersons: addPersons,
          };
        })
        : [];
      setProperties(dbProps);

      // Map Loans from DB (nested under properties)
      const dbLoans: LoanRow[] = [];
      if (Array.isArray(h.properties)) {
        for (const p of h.properties) {
          if (Array.isArray(p.loans)) {
            for (const l of p.loans) {
              const firstSnap =
                Array.isArray(l.snapshots) && l.snapshots.length > 0
                  ? l.snapshots[0]
                  : null;
              const rawBal = firstSnap?.loanBalance
                ? Number(firstSnap.loanBalance)
                : 650000;
              const settDate =
                l.closedDate && l.closedDate !== "----"
                  ? l.closedDate
                  : "----";
              dbLoans.push({
                id: l.id,
                lender: l.lender,
                loanReferences:
                  l.loanReference || l.accountName || l.id.slice(0, 8),
                tchLoan: l.isTchLoan ? "yes" : "No",
                loanAmount: formatMoney(rawBal),
                rawLoanAmount: String(rawBal),
                balance: String(rawBal),
                purpose: l.purpose || "Investment",
                repayment: l.repaymentType || l.loanType || "Interest only",
                rateType: l.rateType || "Variable",
                rate: firstSnap?.interestRate
                  ? `${Number(firstSnap.interestRate) * 100}%`
                  : "5.94%",
                offsetBalance: firstSnap?.offsetBalance
                  ? String(firstSnap.offsetBalance)
                  : "24000",
                settlementDate: settDate,
                rawSettlementDate: settDate !== "----" ? settDate : "",
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
          const fyStr = String(r.financialYear).replace(/^FY/i, "");
          const toYmd = (d: any) => {
            if (!d) return new Date().toISOString().split("T")[0];
            const str = String(d).trim();
            if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
            const parsed = new Date(str);
            return !isNaN(parsed.getTime())
              ? parsed.toISOString().split("T")[0]
              : str;
          };
          const dateStr = toYmd(r.reviewDateStr || r.reviewDate || r.createdAt);

          dbReviews.push({
            id: r.id,
            fy: fyStr,
            finDataInput:
              r.finDataStatus === "COMPLETED" ? "Completed" : "In Progress",
            reviewStatus:
              r.tchReviewStatus === "COMPLETED" ? "Completed" : "In Progress",
            reviewDate: dateStr,
          });

          const isReviewComplete = r.tchReviewStatus === "COMPLETED";
          dbReports.push({
            id: r.id,
            fy: fyStr,
            reportStatus: isReviewComplete ? "Available" : "Not Available",
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
  const [editingEntity, setEditingEntity] = useState<ClientEntityRow | null>(null);
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<PropertyRow | null>(null);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<LoanRow | null>(null);
  const [isReviewYearDropdownOpen, setIsReviewYearDropdownOpen] = useState(false);
  const reviewYearDropdownRef = useRef<HTMLDivElement>(null);
  const dateSelectorInputRef = useRef<HTMLInputElement>(null);
  const [customReviewYear, setCustomReviewYear] = useState<string>("");
  const [addingReviewYear, setAddingReviewYear] = useState(false);
  const [addReviewError, setAddReviewError] = useState("");

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        reviewYearDropdownRef.current &&
        !reviewYearDropdownRef.current.contains(event.target as Node)
      ) {
        setIsReviewYearDropdownOpen(false);
      }
    }
    if (isReviewYearDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isReviewYearDropdownOpen]);

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
  const handleAddEntity = async (newE: EntityFormData) => {
    if (!householdId) return;
    await createEntityApi(householdId, {
      name: newE.name,
      type: newE.type,
      displayType:
        newE.category === "Investment"
          ? `Investment (${newE.type})`
          : newE.type,
      abnOrTfnMasked: newE.abn || "-",
      ageOrDob: newE.regDate || "---",
      phone: newE.phone,
      email: newE.email,
    });
    await loadHouseholdFromDb();
  };

  const handleUpdateEntity = async (
    entityId: string,
    updatedE: EntityFormData
  ) => {
    if (!householdId) return;
    await updateEntityApi(householdId, entityId, {
      name: updatedE.name,
      type: updatedE.type,
      displayType:
        updatedE.category === "Investment"
          ? `Investment (${updatedE.type})`
          : updatedE.type,
      abnOrTfnMasked: updatedE.abn || "-",
      ageOrDob: updatedE.regDate || "---",
      phone: updatedE.phone,
      email: updatedE.email,
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
      acquisitionCosts: parseNumeric(p.purchaseCosts, 45936),
      currentValuation: parseNumeric(p.purchasePrice, 800000),
      weeklyRent: parseNumeric(p.rentWeekly, 850),
      landSize: p.landSize,
      beds: p.beds,
      baths: p.baths,
      cars: p.cars,
      owner1: p.owner1,
      owner1Pct: p.owner1Pct,
      owner2: p.owner2,
      owner2Pct: p.owner2Pct,
      ownersJson: {
        livingArea: p.livingArea,
        additionalPersons: p.additionalPersons,
      },
    });
    await loadHouseholdFromDb();
  };

  const handleUpdateProperty = async (
    propertyId: string,
    p: NewPropertyFormPayload
  ) => {
    if (!householdId) return;
    const fullAddress =
      p.address.includes(p.state) || p.address.includes(p.postcode)
        ? p.address
        : `${p.address}, ${p.state} ${p.postcode}`;

    await updatePropertyApi(householdId, propertyId, {
      name: fullAddress,
      address: fullAddress,
      state: p.state,
      postcode: p.postcode,
      propertyCategory: p.type,
      purposeDisplay: p.purpose,
      type: p.purpose,
      purchaseDateStr: p.purchaseDate,
      purchasePrice: parseNumeric(p.purchasePrice, 800000),
      acquisitionCosts: parseNumeric(p.purchaseCosts, 45936),
      currentValuation: parseNumeric(p.purchasePrice, 800000),
      weeklyRent: parseNumeric(p.rentWeekly, 850),
      landSize: p.landSize,
      beds: p.beds,
      baths: p.baths,
      cars: p.cars,
      owner1: p.owner1,
      owner1Pct: p.owner1Pct,
      owner2: p.owner2,
      owner2Pct: p.owner2Pct,
      ownersJson: {
        livingArea: p.livingArea,
        additionalPersons: p.additionalPersons,
      },
    });
    await loadHouseholdFromDb();
  };

  const handleAddLoan = async (l: NewLoanFormPayload) => {
    if (!householdId) return;
    const loanBalanceVal = parseNumeric(l.loanAmount || l.balance, 650000);
    await createLoanApi(householdId, {
      lender: l.lender,
      loanReference: l.loanReference,
      accountName: l.loanReference,
      isTchLoan: l.isTchLoan,
      purpose: l.purpose,
      repaymentType: l.repaymentType,
      rateType: l.loanType,
      loanType: l.loanType,
      closedDate: l.settlementDate || "----",
      ioExpiry: l.ioExpiry,
      fixedExpiry: l.fixedExpiry,
      maturityDate: l.maturityDate,
      security1: l.security1,
      security2: l.security2,
      security3: l.security3,
      loanBalance: loanBalanceVal,
      offsetBalance: parseNumeric(l.offsetBalance, 24000),
      interestRate: parseNumeric(l.rate, 5.94),
    });
    await loadHouseholdFromDb();
  };

  const handleUpdateLoan = async (loanId: string, l: NewLoanFormPayload) => {
    if (!householdId) return;
    const loanBalanceVal = parseNumeric(l.loanAmount || l.balance, 650000);
    await updateLoanApi(householdId, loanId, {
      lender: l.lender,
      loanReference: l.loanReference,
      accountName: l.loanReference,
      isTchLoan: l.isTchLoan,
      purpose: l.purpose,
      repaymentType: l.repaymentType,
      rateType: l.loanType,
      loanType: l.loanType,
      closedDate: l.settlementDate || "----",
      ioExpiry: l.ioExpiry,
      fixedExpiry: l.fixedExpiry,
      maturityDate: l.maturityDate,
      security1: l.security1,
      security2: l.security2,
      security3: l.security3,
      loanBalance: loanBalanceVal,
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

  const existingReviewYears = useMemo(() => {
    const set = new Set<string>();
    if (Array.isArray(reviews)) {
      reviews.forEach((r) => {
        set.add(String(r.fy).replace(/^FY/i, ""));
      });
    }
    return set;
  }, [reviews]);

  const handleSelectReviewYear = async (yearNum: number) => {
    if (!householdId || addingReviewYear) return;
    if (existingReviewYears.has(String(yearNum))) {
      setAddReviewError(`Review workspace for ${yearNum} already exists.`);
      return;
    }

    setAddingReviewYear(true);
    setAddReviewError("");
    try {
      await createReviewApi(householdId, {
        financialYear: yearNum,
      });
      await loadHouseholdFromDb();
      setIsReviewYearDropdownOpen(false);
      setCustomReviewYear("");
    } catch (err: any) {
      setAddReviewError(err.message || "Failed to create review year");
    } finally {
      setAddingReviewYear(false);
    }
  };

  const handleCustomYearSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const yr = Number(customReviewYear.trim());
    if (!yr || yr < 1990 || yr > 2100) {
      setAddReviewError("Please enter a valid 4-digit year (e.g. 2024)");
      return;
    }
    handleSelectReviewYear(yr);
  };

  const handleDateSelectorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) return;
    const match = val.match(/^(\d{4})/);
    if (match) {
      const yr = parseInt(match[1], 10);
      handleSelectReviewYear(yr);
    }
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
        <TopNav
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onBack={
            selectedFinDataReview
              ? () => {
                setSelectedFinDataReview(null);
                loadHouseholdFromDb();
              }
              : selectedReviewStatusRow
                ? () => {
                  setSelectedReviewStatusRow(null);
                  loadHouseholdFromDb();
                }
                : undefined
          }
        />

        <main
          className={`flex-1 max-w-[1440px] w-full mx-auto ${
            selectedReviewStatusRow ? "px-4 sm:px-6 py-2" : "p-6 sm:p-9"
          }`}
        >
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
              readOnly={isReportReadOnly}
              onBack={() => {
                setSelectedReviewStatusRow(null);
                setIsReportReadOnly(false);
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
                      className={`px-[18px] py-[8px] rounded-[7px] text-[13.5px] font-medium transition-all whitespace-nowrap cursor-pointer ${isActive
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
                      onClick={() => {
                        setEditingEntity(null);
                        setIsEntityModalOpen(true);
                      }}
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
                                className={`w-3.5 h-3.5 transition-transform ${entitySort?.field === "name" &&
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
                                className={`w-3.5 h-3.5 transition-transform ${entitySort?.field === "age" &&
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
                                className={`w-3.5 h-3.5 transition-transform ${entitySort?.field === "mobile" &&
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
                                className={`w-3.5 h-3.5 transition-transform ${entitySort?.field === "email" &&
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
                                className={`w-3.5 h-3.5 transition-transform ${entitySort?.field === "entityType" &&
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
                              <td className="py-4 px-3 text-[14px] text-[#1A1C1E]" title={row.rawDate && row.rawDate !== "---" ? `DOB / Reg: ${row.rawDate}` : undefined}>
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
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingEntity(row);
                                      setIsEntityModalOpen(true);
                                    }}
                                    className="p-1 text-[#8C9BA8] hover:text-[#0E2841] transition-colors cursor-pointer"
                                    title="Edit"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteEntity(row.id)}
                                    className="p-1 text-[#8C9BA8] hover:text-red-500 transition-colors cursor-pointer"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
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
                        onClick={() => {
                          setEditingProperty(null);
                          setIsPropertyModalOpen(true);
                        }}
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
                                onClick={() => togglePropertySort("livingArea")}
                                className="flex items-center gap-1 cursor-pointer"
                              >
                                <span>Living Area</span>
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
                                colSpan={16}
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
                                  {p.livingArea}
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
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingProperty(p);
                                        setIsPropertyModalOpen(true);
                                      }}
                                      className="p-1 text-[#8C9BA8] hover:text-[#0E2841] transition-colors cursor-pointer"
                                      title="Edit"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteProperty(p.id)}
                                      className="p-1 text-[#8C9BA8] hover:text-red-500 transition-colors cursor-pointer"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
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
                        onClick={() => {
                          setEditingLoan(null);
                          setIsLoanModalOpen(true);
                        }}
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
                                onClick={() => toggleLoanSort("loanAmount")}
                                className="flex items-center gap-1 cursor-pointer"
                              >
                                <span>Loan Amount</span>
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
                                onClick={() => toggleLoanSort("settlementDate")}
                                className="flex items-center gap-1 cursor-pointer"
                              >
                                <span>Settlement Date</span>
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
                                colSpan={15}
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
                                  {l.loanAmount}
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
                                  {l.settlementDate}
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
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingLoan(l);
                                        setIsLoanModalOpen(true);
                                      }}
                                      className="p-1 text-[#8C9BA8] hover:text-[#0E2841] transition-colors cursor-pointer"
                                      title="Edit"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteLoan(l.id)}
                                      className="p-1 text-[#8C9BA8] hover:text-red-500 transition-colors cursor-pointer"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
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
                  {/* Top: + ADD REVIEW YEAR button with Date/Year Selector */}
                  <div className="mb-6">
                    <div className="relative inline-block" ref={reviewYearDropdownRef}>
                      <button
                        type="button"
                        onClick={() => {
                          setAddReviewError("");
                          setIsReviewYearDropdownOpen((prev) => !prev);
                        }}
                        disabled={addingReviewYear}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0E2841] hover:bg-[#163859] disabled:opacity-60 text-white text-[13.5px] font-semibold rounded-[8px] transition-colors shadow-2xs cursor-pointer tracking-wider font-['Poppins',sans-serif]"
                      >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                        <span>{addingReviewYear ? "CREATING..." : "ADD REVIEW YEAR"}</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform ${isReviewYearDropdownOpen ? "rotate-180" : ""
                            }`}
                        />
                      </button>

                      {/* Date Selector / Year Selector Popover */}
                      {isReviewYearDropdownOpen && (
                        <div className="absolute left-0 mt-2 w-[340px] bg-white rounded-[14px] shadow-2xl border border-[#E5E7EB] z-50 p-4 animate-in fade-in zoom-in-95 duration-100 font-['Poppins',sans-serif]">
                          <div className="flex items-center justify-between pb-2 border-b border-[#F0F1F3] mb-3">
                            <span className="text-[13px] font-semibold text-[#07315B]">
                              Select Review Year
                            </span>
                            <span className="text-[11px] text-[#8C9BA8]">
                              Date: Today
                            </span>
                          </div>

                          {/* Quick Year Selection Grid */}
                          <div className="grid grid-cols-4 gap-2 mb-3">
                            {[2027, 2026, 2025, 2024, 2023, 2022, 2021, 2020].map((yr) => {
                              const isAdded = existingReviewYears.has(String(yr));
                              return (
                                <button
                                  key={yr}
                                  type="button"
                                  disabled={isAdded || addingReviewYear}
                                  onClick={() => handleSelectReviewYear(yr)}
                                  className={`py-2 px-1 text-center rounded-[8px] text-[13px] font-semibold transition-all cursor-pointer ${isAdded
                                    ? "bg-[#F3F4F6] text-[#9CA3AF] cursor-not-allowed line-through"
                                    : "bg-[#F8FAFC] hover:bg-[#0E2841] hover:text-white text-[#0E2841] border border-[#E2E8F0]"
                                    }`}
                                  title={isAdded ? `${yr} already added` : `Create review for ${yr}`}
                                >
                                  {yr}
                                </button>
                              );
                            })}
                          </div>

                          {/* Date Selector (Calendar Input) */}
                          <div className="pt-2 border-t border-[#F0F1F3] mb-3">
                            <label className="block text-[11.5px] font-medium text-[#4A5568] mb-1.5 flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-[#0E2841]" />
                                Date Selector (Calendar)
                              </span>
                              <span className="text-[10.5px] text-[#8C9BA8]">Picks Year</span>
                            </label>
                            <div className="relative">
                              <input
                                ref={dateSelectorInputRef}
                                type="date"
                                onChange={handleDateSelectorChange}
                                onClick={() => {
                                  try {
                                    dateSelectorInputRef.current?.showPicker();
                                  } catch { }
                                }}
                                className="w-full h-[36px] px-3 bg-[#F9FAFB] border border-[#E2E8F0] rounded-[8px] text-[12.5px] text-[#1A1C1E] cursor-pointer focus:outline-none focus:border-[#0E2841]"
                              />
                            </div>
                          </div>

                          {/* Custom Year Input */}
                          <form onSubmit={handleCustomYearSubmit} className="pt-2 border-t border-[#F0F1F3] flex gap-2">
                            <input
                              type="number"
                              min={1990}
                              max={2100}
                              value={customReviewYear}
                              onChange={(e) => setCustomReviewYear(e.target.value)}
                              placeholder="Other Year (e.g. 2019)"
                              className="flex-1 h-[36px] px-3 bg-[#F9FAFB] border border-[#E2E8F0] rounded-[8px] text-[12.5px] text-[#1A1C1E] focus:outline-none focus:border-[#0E2841]"
                            />
                            <button
                              type="submit"
                              disabled={!customReviewYear.trim() || addingReviewYear}
                              className="px-3 h-[36px] bg-[#0E2841] hover:bg-[#163859] disabled:opacity-50 text-white text-[12px] font-semibold rounded-[8px] transition-colors cursor-pointer shrink-0"
                            >
                              Create
                            </button>
                          </form>
                        </div>
                      )}
                    </div>

                    {addReviewError && (
                      <div className="mt-3 p-2.5 rounded-[8px] bg-red-50 border border-red-200 text-red-600 text-[12.5px]">
                        {addReviewError}
                      </div>
                    )}

                    <div className="mt-5">
                      <h2 className="text-[19px] font-bold text-[#071E36] font-['Poppins',sans-serif]">
                        Review History
                      </h2>
                    </div>
                  </div>

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
                        {sortedReviews.length === 0 ? (
                          <tr>
                            <td
                              colSpan={4}
                              className="py-8 text-center text-[13.5px] text-[#8C9BA8]"
                            >
                              No review workspaces created yet. Click &quot; ADD REVIEW YEAR&quot; above to select a year.
                            </td>
                          </tr>
                        ) : (
                          sortedReviews.map((r) => (
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
                                  className={`underline cursor-pointer font-medium hover:opacity-80 transition-opacity ${r.finDataInput === "Completed"
                                    ? "text-[#0B7B3E]"
                                    : "text-[#C66900]"
                                    }`}
                                >
                                  {r.finDataInput}
                                </span>
                              </td>
                              <td className="py-4 px-3 text-[14px]">
                                <span
                                  onClick={() => {
                                    setIsReportReadOnly(false);
                                    setSelectedReviewStatusRow(r);
                                  }}
                                  className={`underline cursor-pointer font-medium hover:opacity-80 transition-opacity ${r.reviewStatus === "Completed"
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
                          ))
                        )}
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
                                className={`font-semibold ${
                                  rep.reportStatus === "Available"
                                    ? "text-[#0B7B3E]"
                                    : "text-[#DC2626]"
                                }`}
                              >
                                {rep.reportStatus}
                              </span>
                            </td>
                            <td className="py-4 px-3 text-[14px]">
                              {rep.reportStatus === "Available" ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsReportReadOnly(true);
                                    setSelectedReviewStatusRow({
                                      id: rep.id,
                                      fy: rep.fy,
                                      finDataInput: "Completed",
                                      reviewStatus: "Completed",
                                      reviewDate: rep.shareDate,
                                    });
                                  }}
                                  className="text-[#1A56DB] underline cursor-pointer font-medium hover:text-[#163859] transition-colors"
                                >
                                  {rep.share || "Launch"}
                                </button>
                              ) : (
                                <span
                                  className="text-[#8C9BA8] font-medium cursor-not-allowed select-none"
                                  title="Report is not available until Review Workspace status is marked Complete"
                                >
                                  {rep.share || "Launch"}
                                </span>
                              )}
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
        onClose={() => {
          setIsEntityModalOpen(false);
          setEditingEntity(null);
        }}
        initialData={editingEntity}
        onAddEntity={handleAddEntity}
        onUpdateEntity={handleUpdateEntity}
      />

      <AddPropertyModal
        isOpen={isPropertyModalOpen}
        onClose={() => {
          setIsPropertyModalOpen(false);
          setEditingProperty(null);
        }}
        initialData={editingProperty}
        onAddProperty={handleAddProperty}
        onUpdateProperty={handleUpdateProperty}
        availableEntities={entities.map((e) => ({
          id: e.id,
          name: e.name,
          type: e.entityType,
        }))}
      />

      <AddLoanModal
        isOpen={isLoanModalOpen}
        onClose={() => {
          setIsLoanModalOpen(false);
          setEditingLoan(null);
        }}
        initialData={editingLoan}
        onAddLoan={handleAddLoan}
        onUpdateLoan={handleUpdateLoan}
        availableProperties={properties.map((p) => p.address)}
      />
    </div>
  );
}
