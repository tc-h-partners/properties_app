"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Calendar,
  Check,
  ChevronLeft,
  Plus,
  Trash2,
} from "lucide-react";
import AddPropertyModal, { NewPropertyFormPayload } from "./AddPropertyModal";
import AddLoanModal, { NewLoanFormPayload } from "./AddLoanModal";
import {
  createPropertyApi,
  createLoanApi,
  updatePropertyApi,
  updateLoanApi,
  updateEntityApi,
  updateHouseholdApi,
  savePropertySnapshotsApi,
  saveLoanSnapshotsApi,
  updateFinDataStatusApi,
  fetchBenchmarksApi,
  fetchSystemSettingsApi,
} from "@/lib/api";

export type FinDataTab =
  | "household-income"
  | "property-data"
  | "loan-data"
  | "market-data";

interface FinancialDataInputProps {
  householdId?: string;
  reviewId?: string;
  dbHousehold?: any;
  onDataChanged?: () => Promise<void> | void;
  year?: string;
  status?: string;
  householdName?: string;
  onBackToWorkspace: () => void;
}

function parseNum(val: any, fallback = 0): number {
  const cleaned = String(val ?? "").replace(/[^0-9.-]/g, "");
  const n = Number(cleaned);
  return isNaN(n) ? fallback : n;
}

function fmtMoney(val: any): string {
  const n = parseNum(val, 0);
  return `$${n.toLocaleString("en-AU", { maximumFractionDigits: 0 })}`;
}

function cleanMoneyInput(val: string): string {
  if (!val) return "";
  // Strip invalid characters but keep $, digits, commas, periods
  let cleaned = val.replace(/[^0-9$,.]/g, "");
  if (cleaned === "$") return "$";
  // Strip leading zeros before a non-zero digit: e.g. "$05" -> "$5", "05" -> "5"
  cleaned = cleaned.replace(/^\$0+([1-9])/, "$$$1").replace(/^0+([1-9])/, "$1");
  if (cleaned === "$0$" || cleaned === "0$") return "$";
  return cleaned;
}

function formatSavedDateTime(d?: any): string {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const yr = String(date.getFullYear()).slice(-2);
  let hours = date.getHours();
  const mins = date.getMinutes();
  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minsStr = mins > 0 ? `:${String(mins).padStart(2, "0")}` : "";
  return `${day}/${month}/${yr} @ ${hours}${minsStr}${ampm}`;
}

function toHtmlDateValue(val: string): string {
  if (!val) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  if (val.includes("T")) return val.split("T")[0];
  const parts = val.split(/[/-]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
    if (parts[2].length === 4) return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
  }
  return "";
}



export interface PropertyExpenseItem {
  id: string;
  name: string;
  category: string;
  amount: string;
  placeholder?: string;
  hasAsterisk?: boolean;
  fieldKey?: string;
  isFullWidth?: boolean;
  isCustom?: boolean;
}

export const STANDARD_EXPENSE_CATEGORIES = [
  "Property Management",
  "Property Operating Costs",
  "Government & Statutory Charges",
  "Finance Cost",
];

export const EXPENSE_CATEGORIES_CONFIG = [
  {
    key: "Property Management",
    title: "1. Property Management $",
    items: [
      {
        id: "exp-mgmt-commissions",
        name: "Management commissions",
        placeholder: "$780",
        hasAsterisk: false,
        fieldKey: "propertyManagementFees",
      },
      {
        id: "exp-letting-fees",
        name: "Letting fees",
        placeholder: "$840",
        hasAsterisk: true,
        fieldKey: "lettingFees",
      },
      {
        id: "exp-lease-renewal",
        name: "Lease renewal charges",
        placeholder: "$780",
        hasAsterisk: false,
        fieldKey: "leaseRenewalCharges",
      },
      {
        id: "exp-marketing",
        name: "Marketing",
        placeholder: "$780",
        hasAsterisk: false,
        fieldKey: "marketing",
      },
      {
        id: "exp-routine-inspections",
        name: "Routine inspection costs",
        placeholder: "$840",
        hasAsterisk: true,
        fieldKey: "routineInspectionCosts",
      },
    ],
  },
  {
    key: "Property Operating Costs",
    title: "2. Property Operating Costs",
    items: [
      {
        id: "exp-council-rates",
        name: "Council rates",
        placeholder: "$780",
        hasAsterisk: false,
        fieldKey: "councilRates",
      },
      {
        id: "exp-insurance",
        name: "Landlord / building insurance",
        placeholder: "$840",
        hasAsterisk: true,
        fieldKey: "insurance",
      },
      {
        id: "exp-pest-control",
        name: "Pest control",
        placeholder: "$780",
        hasAsterisk: false,
        fieldKey: "pestControl",
      },
      {
        id: "exp-strata-levies",
        name: "Strata levies",
        placeholder: "$780",
        hasAsterisk: false,
        fieldKey: "strataFees",
      },
      {
        id: "exp-water-charges",
        name: "Water charges",
        placeholder: "$840",
        hasAsterisk: true,
        fieldKey: "waterRates",
      },
      {
        id: "exp-repairs-maintenance",
        name: "Repairs & maintenance",
        placeholder: "$840",
        hasAsterisk: true,
        fieldKey: "repairsMaintenance",
      },
      {
        id: "exp-operating-costs-add-total",
        name: "Add Total $",
        placeholder: "$780",
        hasAsterisk: false,
        fieldKey: "operatingCostsAddTotal",
      },
    ],
  },
  {
    key: "Government & Statutory Charges",
    title: "3. Government & Statutory Charges",
    items: [
      {
        id: "exp-land-tax",
        name: "State land tax notices",
        placeholder: "$780",
        hasAsterisk: false,
        fieldKey: "landTax",
      },
      {
        id: "exp-statutory-levies",
        name: "Statutory municipal levies",
        placeholder: "$840",
        hasAsterisk: true,
        fieldKey: "statutoryMunicipalLevies",
      },
      {
        id: "exp-annual-compliance",
        name: "Annual regulatory compliance inspection",
        placeholder: "$780",
        hasAsterisk: false,
        fieldKey: "annualComplianceInspection",
      },
      {
        id: "exp-statutory-charges-add-total",
        name: "Add Total $",
        placeholder: "$780",
        hasAsterisk: false,
        fieldKey: "statutoryChargesAddTotal",
      },
    ],
  },
  {
    key: "Finance Cost",
    title: "4. Finance Cost",
    items: [
      {
        id: "exp-bank-mortgage-interest",
        name: "Bank mortgage interest",
        placeholder: "$780",
        hasAsterisk: false,
        fieldKey: "bankMortgageInterest",
      },
      {
        id: "exp-annual-package-fees",
        name: "Annual package fees",
        placeholder: "$840",
        hasAsterisk: true,
        fieldKey: "annualPackageFees",
      },
      {
        id: "exp-debt-service-charges",
        name: "Ongoing debt service charges",
        placeholder: "$780",
        hasAsterisk: false,
        fieldKey: "debtServiceCharges",
      },
      {
        id: "exp-net-taxable-rental-income",
        name: "Net Taxable Rental Income",
        placeholder: "$780",
        hasAsterisk: false,
        fieldKey: "netTaxableRentalIncome",
      },
      {
        id: "exp-other-expenses",
        name: "Other expenses",
        placeholder: "$840",
        hasAsterisk: true,
        fieldKey: "otherExpenses",
      },
      {
        id: "exp-net-rent-tax-return",
        name: "Net Rent (per tax Return)",
        placeholder: "$780",
        hasAsterisk: false,
        fieldKey: "netRentTaxReturn",
      },
      {
        id: "exp-finance-cost-add-total",
        name: "Add Total $",
        placeholder: "$780",
        hasAsterisk: false,
        fieldKey: "financeCostAddTotal",
      },
      {
        id: "exp-depreciation",
        name: "Depreciation",
        placeholder: "Depreciation.....",
        hasAsterisk: false,
        fieldKey: "depreciationNonCash",
        isFullWidth: true,
      },
    ],
  },
];

// Flat default list of all 24 categorized property expense items
export const DEFAULT_EXPENSE_ITEMS: PropertyExpenseItem[] = EXPENSE_CATEGORIES_CONFIG.flatMap(
  (cat) =>
    cat.items.map((item) => ({
      ...item,
      category: cat.key,
      amount: "",
    }))
);

// Small dark solid dropdown arrow matching Figma's `arrow-down` in table headers
function TableSortArrow() {
  return (
    <svg
      width="10"
      height="6"
      viewBox="0 0 10 6"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <path d="M1 1L5 5L9 1H1Z" fill="#1A1C1E" stroke="#1A1C1E" strokeWidth="1" strokeLinejoin="round" />
    </svg>
  );
}

export default function FinancialDataInput({
  householdId = "",
  reviewId = "",
  dbHousehold,
  onDataChanged,
  year = "2025",
  status = "Not Started",
  householdName = "Harrison family",
  onBackToWorkspace,
}: FinancialDataInputProps) {
  const [activeTab, setActiveTab] = useState<FinDataTab>("household-income");

  // Navigation mode for Property and Loan data (list vs detail)
  const [propertyViewMode, setPropertyViewMode] = useState<"detail" | "list">("list");
  const [loanViewMode, setLoanViewMode] = useState<"detail" | "list">("list");

  // Modals for adding property/loan from Fin Data Input
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);

  // Property selection & dropdown state (populated from DB)
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [isPropertyDropdownOpen, setIsPropertyDropdownOpen] = useState(false);

  // Loan selection & dropdown state (populated from DB)
  const [loans, setLoans] = useState<any[]>([]);
  const [selectedLoanId, setSelectedLoanId] = useState("");
  const [isLoanDropdownOpen, setIsLoanDropdownOpen] = useState(false);
  const [savingMsg, setSavingMsg] = useState("");

  const activeReview = useMemo(() => {
    if (!dbHousehold || !Array.isArray(dbHousehold.reviews)) return null;
    return (
      dbHousehold.reviews.find((r: any) => r.id === reviewId) ||
      dbHousehold.reviews[0] ||
      null
    );
  }, [dbHousehold, reviewId]);

  const effectiveReviewId = reviewId || activeReview?.id || "";

  const selectedProperty =
    properties.find((p) => p.id === selectedPropertyId) ||
    properties[0] || {
      id: "",
      address: "No Property Added Yet",
      listName: "No Property Added Yet",
      purpose: "Investment",
      type: "House",
      listType: "House",
      eofyValuation: "$0",
      reviewValuation: "$0",
      rentWeekly: "$0/wk",
      marketRentWeekly: "$0",
      status: "Not Started",
    };

  const selectedLoan =
    loans.find((l) => l.id === selectedLoanId) ||
    loans[0] || {
      id: "",
      facilityId: "N/A",
      title: "No Loan Added Yet",
      lender: "-",
      purpose: "Investment",
      repayment: "Interest only",
      rateType: "Variable",
      ioExpiry: "----",
      fixedExpiry: "----",
      maturity: "----",
      security1: "-",
      eofyBalance: "",
      reviewBalance: "",
      marketRate: "N/A",
      interestEofy: "",
      interestReview: "",
      interestMarket: "",
      offsetEofy: "",
      offsetReview: "",
      status: "Not Started",
    };

  // =========================================================================
  // TAB 1: Household Income State (loaded from DB)
  // =========================================================================
  const [salaryRows, setSalaryRows] = useState<
    {
      id: string;
      client: string;
      entity: string;
      salary: string;
      taxRate: string;
      superAmount: string;
    }[]
  >([]);

  const [creditCardLimit, setCreditCardLimit] = useState("");
  const [householdExpenditure, setHouseholdExpenditure] = useState("");
  const [monthlyPayments, setMonthlyPayments] = useState("");
  const [otherLiabilities, setOtherLiabilities] = useState("");
  const [cash, setCash] = useState("");
  const [borrowingCapacity, setBorrowingCapacity] = useState("");
  const router = useRouter();
  const [systemBenchmarks, setSystemBenchmarks] = useState<any[]>([]);

  // Focus helper: clears default zero strings on click so user types without backspacing, or selects all text
  const handleMoneyFocus = (
    e: React.FocusEvent<HTMLInputElement>,
    val: string,
    setter: (v: string) => void
  ) => {
    if (
      val === "$0" ||
      val === "0" ||
      val === "$" ||
      val === "$800,000" ||
      val === "$47,000" ||
      val === "$4,500" ||
      val === "$4500"
    ) {
      setter("");
    } else {
      e.target.select();
    }
  };

  useEffect(() => {
    fetchSystemSettingsApi()
      .then((res) => {
        if (res && Array.isArray(res.benchmarks)) {
          setSystemBenchmarks(res.benchmarks);
        }
      })
      .catch(() => {});
  }, [activeTab]);

  // Sync state from dbHousehold whenever dbHousehold loads or updates
  useEffect(() => {
    if (!dbHousehold) return;

    // 1. Entities -> salaryRows
    const dbEntities = Array.isArray(dbHousehold.entities)
      ? dbHousehold.entities
      : [];
    setSalaryRows(
      dbEntities.map((e: any) => {
        const rateNum = Number(e.marginalTaxRate ?? 0.37);
        const pct =
          rateNum <= 1 ? `${Math.round(rateNum * 100)}%` : `${Math.round(rateNum)}%`;
        const salaryNum = parseNum(e.annualSalary, 0);
        const superNum = parseNum(e.superBalance, 0);
        return {
          id: e.id,
          client: e.name,
          entity: e.displayType || e.type || "Individual",
          salary: salaryNum > 0 ? fmtMoney(salaryNum) : "",
          taxRate: pct,
          superAmount: superNum > 0 ? fmtMoney(superNum) : "",
        };
      })
    );

    const expNum = parseNum(dbHousehold.householdExpenditure, 0);
    setHouseholdExpenditure(expNum > 0 && expNum !== 4500 ? fmtMoney(expNum) : "");

    const ccNum = parseNum(dbHousehold.creditCardLimit, 0);
    setCreditCardLimit(ccNum > 0 ? fmtMoney(ccNum) : "");

    const liabNum = parseNum(dbHousehold.otherLiabilities, 0);
    setOtherLiabilities(liabNum > 0 ? fmtMoney(liabNum) : "");

    const payNum = parseNum(dbHousehold.monthlyPayments, 0);
    setMonthlyPayments(payNum > 0 ? fmtMoney(payNum) : "");

    const borrowNum = parseNum(dbHousehold.borrowingCapacity, 0);
    setBorrowingCapacity(
      borrowNum > 0 && borrowNum !== 800000 ? fmtMoney(borrowNum) : ""
    );

    const cashNum = parseNum(dbHousehold.cashSavings, 0);
    setCash(cashNum > 0 && cashNum !== 47000 ? fmtMoney(cashNum) : "");

    // 2. Properties
    const propSnaps = Array.isArray(activeReview?.propertySnapshots)
      ? activeReview.propertySnapshots
      : [];
    const mappedProps = (dbHousehold.properties || []).map((p: any) => {
      const eofySnap =
        propSnaps.find(
          (s: any) => s.propertyId === p.id && s.snapshotPoint === "EOFY"
        ) ||
        (p.snapshots || []).find((s: any) => s.snapshotPoint === "EOFY");
      const revSnap =
        propSnaps.find(
          (s: any) => s.propertyId === p.id && s.snapshotPoint === "REVIEW_DATE"
        ) ||
        (p.snapshots || []).find((s: any) => s.snapshotPoint === "REVIEW_DATE");

      const purpose =
        p.purposeDisplay ||
        (p.type === "OWNER_OCCUPIED" ? "Owner-Occupied" : "Investment");
      const isOO = p.type === "OWNER_OCCUPIED";
      const wkRent = revSnap
        ? Number(revSnap.weeklyRent)
        : Number(p.weeklyRent || 0);

      return {
        id: p.id,
        address: p.address,
        listName: p.name || p.address,
        purpose,
        type: p.propertyCategory || "House",
        listType: p.propertyCategory || "House",
        eofyValuation: fmtMoney(
          eofySnap ? eofySnap.valuation : p.purchasePrice
        ),
        reviewValuation: fmtMoney(
          revSnap ? revSnap.valuation : p.currentValuation || p.purchasePrice
        ),
        rentWeekly: isOO ? "----" : `$${wkRent}/wk`,
        marketRentWeekly: isOO
          ? "----"
          : fmtMoney(revSnap?.marketWeeklyRent || wkRent),
        status: (
          revSnap?.detailsJson?.userCompleted
            ? "Completed"
            : revSnap?.status === "In Progress" || revSnap?.status === "IN_PROGRESS"
            ? "In Progress"
            : "Not Started"
        ) as "Completed" | "In Progress" | "Not Started",
        rawProperty: p,
        eofySnap,
        revSnap,
      };
    });
    setProperties(mappedProps);
    if (
      mappedProps.length > 0 &&
      (!selectedPropertyId ||
        !mappedProps.some((mp: any) => mp.id === selectedPropertyId))
    ) {
      setSelectedPropertyId(mappedProps[0].id);
    }

    // 3. Loans
    const loanSnaps = Array.isArray(activeReview?.loanSnapshots)
      ? activeReview.loanSnapshots
      : [];
    const mappedLoans: any[] = [];
    for (const p of dbHousehold.properties || []) {
      for (const l of p.loans || []) {
        const eofySnap =
          loanSnaps.find(
            (s: any) => s.loanId === l.id && s.snapshotPoint === "EOFY"
          ) ||
          (l.snapshots || []).find((s: any) => s.snapshotPoint === "EOFY");
        const revSnap =
          loanSnaps.find(
            (s: any) => s.loanId === l.id && s.snapshotPoint === "REVIEW_DATE"
          ) ||
          (l.snapshots || []).find((s: any) => s.snapshotPoint === "REVIEW_DATE");

        const ref = l.loanReference || l.accountName || l.id.slice(0, 8);
        const eofyRate = eofySnap?.interestRate ? Number(eofySnap.interestRate) : 0;
        const revRate = revSnap?.interestRate ? Number(revSnap.interestRate) : 0;
        const mktRate = revSnap?.marketRate ? Number(revSnap.marketRate) : 0;

        const eofyBal = parseNum(eofySnap?.loanBalance, 0);
        const revBal = parseNum(revSnap?.loanBalance, 0);
        const eofyOffset = parseNum(eofySnap?.offsetBalance, 0);
        const revOffset = parseNum(revSnap?.offsetBalance, 0);

        mappedLoans.push({
          id: l.id,
          facilityId: ref,
          title: l.accountName || `${ref} — ${l.lender} (${l.purpose || "Investment"})`,
          lender: l.lender,
          purpose: l.purpose || "Investment",
          repayment: l.repaymentType || l.loanType || "Interest only",
          rateType: l.rateType || "Variable",
          ioExpiry: l.ioExpiry || "----",
          fixedExpiry: l.fixedExpiry || "----",
          maturity: l.maturityDate || "24/10/2026",
          security1: l.security1 || p.address,
          eofyBalance: eofyBal > 0 ? fmtMoney(eofyBal) : "",
          reviewBalance: revBal > 0 ? fmtMoney(revBal) : "",
          marketRate: "N/A",
          interestEofy: eofyRate > 0 ? `${((eofyRate <= 1 ? eofyRate * 100 : eofyRate)).toFixed(2)}%` : "",
          interestReview: revRate > 0 ? `${((revRate <= 1 ? revRate * 100 : revRate)).toFixed(2)}%` : "",
          interestMarket: mktRate > 0 ? `${((mktRate <= 1 ? mktRate * 100 : mktRate)).toFixed(2)}%` : "",
          offsetEofy: eofyOffset > 0 ? fmtMoney(eofyOffset) : "",
          offsetReview: revOffset > 0 ? fmtMoney(revOffset) : "",
          status: (
            revSnap?.detailsJson?.userCompleted
              ? "Completed"
              : revSnap?.status === "In Progress" || revSnap?.status === "IN_PROGRESS"
              ? "In progress"
              : "Not Started"
          ) as "Completed" | "In progress" | "Not Started",
          isClosed: Boolean(l.isClosed),
          closedDate: l.closedDate || "",
          rawLoan: l,
          eofySnap,
          revSnap,
        });
      }
    }
    setLoans(mappedLoans);
    if (
      mappedLoans.length > 0 &&
      (!selectedLoanId ||
        !mappedLoans.some((ml: any) => ml.id === selectedLoanId))
    ) {
      setSelectedLoanId(mappedLoans[0].id);
    }
  }, [dbHousehold, activeReview]);

  // =========================================================================
  // TAB 2: Property Data State (Figma Frame 630:5992)
  // =========================================================================
  const soldDateInputRef = useRef<HTMLInputElement>(null);
  const [soldDate, setSoldDate] = useState("");
  const [eofyValuation, setEofyValuation] = useState("");
  const [eofyRent, setEofyRent] = useState("");
  const [eofyMarketRent, setEofyMarketRent] = useState("");
  const [reviewValuation, setReviewValuation] = useState("");
  const [reviewRent, setReviewRent] = useState("");
  const [reviewMarketRent, setReviewMarketRent] = useState("");
  const [grossRent, setGrossRent] = useState("");
  const [weeksRented, setWeeksRented] = useState("");

  // =========================================================================
  // Property Expense Classification Reference Guide States
  // =========================================================================
  const [expenseItems, setExpenseItems] = useState<PropertyExpenseItem[]>(() =>
    DEFAULT_EXPENSE_ITEMS.map((item) => ({
      ...item,
      amount: "",
    }))
  );
  const [allExpenseCategories, setAllExpenseCategories] = useState<string[]>(
    STANDARD_EXPENSE_CATEGORIES
  );
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [newExpenseName, setNewExpenseName] = useState("");
  const [newExpenseCategory, setNewExpenseCategory] = useState("Property Management");
  const [newExpenseAmount, setNewExpenseAmount] = useState("");
  const [isCustomCategoryActive, setIsCustomCategoryActive] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState("");

  const [selectedPropertyStatus, setSelectedPropertyStatus] = useState<string>("Not Started");
  const [propertySavedAt, setPropertySavedAt] = useState<string | Date | null>(null);

  // Total Property Outgoings / Expenses (Dynamic sum of all active expense items)
  const totalExpensesSum = useMemo(() => {
    return expenseItems.reduce((acc, curr) => acc + parseNum(curr.amount, 0), 0);
  }, [expenseItems]);

  const handleExpenseCategoryChange = (id: string, newCat: string) => {
    if (newCat === "__ADD_NEW__") {
      const customCat = window.prompt("Enter new expense category name:");
      if (customCat && customCat.trim()) {
        const trimmed = customCat.trim();
        if (!allExpenseCategories.includes(trimmed)) {
          setAllExpenseCategories((prev) => [...prev, trimmed]);
        }
        setExpenseItems((prev) =>
          prev.map((i) => (i.id === id ? { ...i, category: trimmed } : i))
        );
      }
      return;
    }
    setExpenseItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, category: newCat } : i))
    );
  };

  const handleExpenseAmountChange = (id: string, rawVal: string) => {
    const cleaned = cleanMoneyInput(rawVal);
    setExpenseItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, amount: cleaned } : i))
    );
  };

  const handleExpenseAmountBlur = (id: string, currentVal: string) => {
    if (!currentVal) return;
    const num = parseNum(currentVal, 0);
    if (num > 0) {
      setExpenseItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, amount: fmtMoney(num) } : i))
      );
    }
  };

  const handleExpenseAmountFocus = (
    e: React.FocusEvent<HTMLInputElement>,
    id: string,
    currentVal: string
  ) => {
    if (currentVal === "$0" || currentVal === "0" || currentVal === "$") {
      setExpenseItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, amount: "" } : i))
      );
    } else {
      e.target.select();
    }
  };

  const handleDeleteExpenseItem = (id: string) => {
    setExpenseItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleAddExpenseItem = () => {
    const finalName = newExpenseName.trim();
    if (!finalName) return;
    const finalCat = isCustomCategoryActive
      ? customCategoryInput.trim() || "Property Management"
      : newExpenseCategory;

    if (finalCat && !allExpenseCategories.includes(finalCat)) {
      setAllExpenseCategories((prev) => [...prev, finalCat]);
    }

    const newItem = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: finalName,
      category: finalCat,
      amount: newExpenseAmount ? cleanMoneyInput(newExpenseAmount) : "",
      isCustom: true,
    };

    setExpenseItems((prev) => {
      const updated = [...prev, newItem];
      return updated.sort((a, b) => a.name.localeCompare(b.name));
    });

    setNewExpenseName("");
    setNewExpenseCategory("Property Management");
    setNewExpenseAmount("");
    setIsCustomCategoryActive(false);
    setCustomCategoryInput("");
    setIsAddingExpense(false);
  };

  // =========================================================================
  // TAB 3: Loan Data State (Figma Frame 625:6863)
  // =========================================================================
  const loanClosedDateInputRef = useRef<HTMLInputElement>(null);
  const [loanStatus, setLoanStatus] = useState<string>("Not Started");
  const [loanSavedAt, setLoanSavedAt] = useState<string | Date | null>(null);
  const [isLoanClosed, setIsLoanClosed] = useState(false);
  const [loanClosedDate, setLoanClosedDate] = useState("");
  const [loanBalanceEofy, setLoanBalanceEofy] = useState("");
  const [loanBalanceReview, setLoanBalanceReview] = useState("");
  const [interestRateEofy, setInterestRateEofy] = useState("");
  const [interestRateReview, setInterestRateReview] = useState("");
  const [interestRateMarket, setInterestRateMarket] = useState("");
  const [offsetEofy, setOffsetEofy] = useState("");
  const [offsetReview, setOffsetReview] = useState("");

  // Populate Property Detail form inputs whenever selectedProperty changes
  useEffect(() => {
    if (!selectedProperty || !selectedProperty.id) return;
    const eofy = selectedProperty.eofySnap;
    const rev = selectedProperty.revSnap;
    const raw = selectedProperty.rawProperty;

    setSoldDate(raw?.soldDate || "");
    const eofyValNum = parseNum(eofy ? eofy.valuation : raw?.purchasePrice, 0);
    setEofyValuation(eofyValNum > 0 ? fmtMoney(eofyValNum) : "");

    const eofyRentNum = parseNum(eofy ? eofy.weeklyRent : raw?.weeklyRent, 0);
    setEofyRent(eofyRentNum > 0 ? fmtMoney(eofyRentNum) : "");

    const eofyMktRentNum = parseNum(eofy?.marketWeeklyRent, 0);
    setEofyMarketRent(eofyMktRentNum > 0 ? fmtMoney(eofyMktRentNum) : "");

    const revValNum = parseNum(
      rev ? rev.valuation : raw?.currentValuation ?? raw?.purchasePrice,
      0
    );
    setReviewValuation(revValNum > 0 ? fmtMoney(revValNum) : "");

    const revRentNum = parseNum(rev ? rev.weeklyRent : raw?.weeklyRent, 0);
    setReviewRent(revRentNum > 0 ? fmtMoney(revRentNum) : "");

    const revMktRentNum = parseNum(rev?.marketWeeklyRent, 0);
    setReviewMarketRent(revMktRentNum > 0 ? fmtMoney(revMktRentNum) : "");

    const grossRentNum = parseNum(
      rev ? rev.annualGrossRent : raw?.weeklyRent ? raw.weeklyRent * 52 : 0,
      0
    );
    setGrossRent(grossRentNum > 0 ? fmtMoney(grossRentNum) : "");
    setWeeksRented(
      rev?.vacancyWeeks !== undefined && rev?.vacancyWeeks !== null
        ? String(52 - Number(rev.vacancyWeeks))
        : ""
    );

    // Load Expense Classification field values from DB or detailsJson
    const savedExp = rev?.detailsJson || {};
    const isUserCompleted = Boolean(savedExp?.userCompleted);
    const propStatus = isUserCompleted
      ? "Completed"
      : rev?.status === "In Progress" || rev?.status === "IN_PROGRESS"
      ? "In Progress"
      : "Not Started";
    setSelectedPropertyStatus(propStatus);
    setPropertySavedAt(savedExp?.savedAt || rev?.updatedAt || raw?.updatedAt || null);

    const findSavedValue = (defItem: PropertyExpenseItem) => {
      // 1. Check savedExp.expenseItems array
      if (Array.isArray(savedExp.expenseItems)) {
        const found = savedExp.expenseItems.find(
          (i: any) =>
            i.id === defItem.id ||
            (defItem.fieldKey && i.fieldKey === defItem.fieldKey) ||
            (i.name && i.name.toLowerCase() === defItem.name.toLowerCase() && i.category === defItem.category) ||
            (i.name && i.name.toLowerCase() === defItem.name.toLowerCase())
        );
        if (found && found.amount) return found.amount;
      }
      // 2. Check snapshot columns or detailsJson by fieldKey
      if (defItem.fieldKey) {
        if (rev && rev[defItem.fieldKey] !== undefined && rev[defItem.fieldKey] !== null) {
          const n = parseNum(rev[defItem.fieldKey], 0);
          if (n > 0) return fmtMoney(n);
        }
        if (savedExp[defItem.fieldKey] !== undefined && savedExp[defItem.fieldKey] !== null) {
          const n = parseNum(savedExp[defItem.fieldKey], 0);
          if (n > 0) return fmtMoney(n);
        }
      }
      return "";
    };

    const loadedDefaults = DEFAULT_EXPENSE_ITEMS.map((item) => ({
      ...item,
      amount: findSavedValue(item),
    }));

    // Retain any custom expense items previously added by the user
    const customSaved = Array.isArray(savedExp.expenseItems)
      ? savedExp.expenseItems
          .filter(
            (si: any) =>
              si.isCustom ||
              !DEFAULT_EXPENSE_ITEMS.some(
                (di) =>
                  di.id === si.id ||
                  (di.name.toLowerCase() === (si.name || "").toLowerCase() &&
                    di.category === si.category)
              )
          )
          .map((si: any) => ({
            id: si.id || `custom-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name: si.name,
            category: si.category || "Property Management",
            amount: si.amount || "",
            isCustom: true,
          }))
      : [];

    setExpenseItems([...loadedDefaults, ...customSaved]);

    if (Array.isArray(savedExp.expenseItems) && savedExp.expenseItems.length > 0) {
      const savedCats = savedExp.expenseItems
        .map((i: any) => i.category)
        .filter(Boolean);
      setAllExpenseCategories((prev) =>
        Array.from(new Set([...STANDARD_EXPENSE_CATEGORIES, ...savedCats]))
      );
    }
  }, [selectedProperty?.id]);

  // Populate Loan Detail form inputs whenever selectedLoan changes
  useEffect(() => {
    if (!selectedLoan || !selectedLoan.id) return;
    const rev = selectedLoan.revSnap;
    const raw = selectedLoan.rawLoan;
    setIsLoanClosed(Boolean(selectedLoan.isClosed));
    setLoanClosedDate(selectedLoan.closedDate || "");
    setLoanStatus(selectedLoan.status || rev?.status || "Not Started");
    setLoanSavedAt(rev?.updatedAt || raw?.updatedAt || null);

    setLoanBalanceEofy(selectedLoan.eofyBalance || "");
    setLoanBalanceReview(selectedLoan.reviewBalance || "");
    setInterestRateEofy(selectedLoan.interestEofy || "");
    setInterestRateReview(selectedLoan.interestReview || "");
    setInterestRateMarket(selectedLoan.interestMarket || "");
    setOffsetEofy(selectedLoan.offsetEofy || "");
    setOffsetReview(selectedLoan.offsetReview || "");
  }, [selectedLoan?.id]);

  const combinedSalaryTotal = useMemo(() => {
    return salaryRows.reduce((sum, r) => sum + parseNum(r.salary, 0), 0);
  }, [salaryRows]);

  const totalSuperSum = useMemo(() => {
    return salaryRows.reduce((sum, r) => sum + parseNum(r.superAmount, 0), 0);
  }, [salaryRows]);

  const handleSaveHouseholdIncome = async () => {
    if (!householdId) return;
    setSavingMsg("Saving household income to database...");
    try {
      await Promise.all([
        updateHouseholdApi(householdId, {
          householdExpenditure: parseNum(householdExpenditure, 0),
          creditCardLimit: parseNum(creditCardLimit, 0),
          otherLiabilities: parseNum(otherLiabilities, 0),
          monthlyPayments: parseNum(monthlyPayments, 0),
          borrowingCapacity: parseNum(borrowingCapacity, 0),
          cashSavings: parseNum(cash, 0),
        }),
        ...salaryRows.map((row) => {
          const rawRate = parseNum(row.taxRate, 37);
          const rateDecimal = rawRate > 1 ? rawRate / 100 : rawRate;
          return updateEntityApi(householdId, row.id, {
            annualSalary: parseNum(row.salary, 0),
            marginalTaxRate: rateDecimal,
            superBalance: parseNum(row.superAmount, 0),
          });
        }),
      ]);
      await onDataChanged?.();
      setSavingMsg("Saved to database!");
      setTimeout(() => setSavingMsg(""), 2000);
    } catch (err) {
      console.error("Failed to save household income:", err);
      setSavingMsg("Error saving data");
    }
  };

  const handleSavePropertySnapshots = async (markCompleted = false) => {
    if (!selectedProperty?.id || !effectiveReviewId) {
      if (markCompleted) onBackToWorkspace();
      return;
    }
    setSavingMsg("Saving property data to database...");
    try {
      if (householdId && soldDate !== (selectedProperty.rawProperty?.soldDate || "")) {
        await updatePropertyApi(householdId, selectedProperty.id, { soldDate });
      }
      const findAmt = (fieldKeyOrName: string) => {
        const item = expenseItems.find(
          (i) =>
            i.fieldKey === fieldKeyOrName ||
            i.name.toLowerCase() === fieldKeyOrName.toLowerCase()
        );
        return item ? parseNum(item.amount, 0) : 0;
      };

      const councilRatesNum = findAmt("councilRates");
      const waterChargesNum = findAmt("waterRates");
      const insuranceNum = findAmt("insurance");
      const mgmtCommissionsNum = findAmt("propertyManagementFees");
      const repairsMaintenanceNum = findAmt("repairsMaintenance");
      const landTaxNum = findAmt("landTax");
      const strataLeviesNum = findAmt("strataFees");
      const otherExpensesNum = findAmt("otherExpenses");
      const depreciationNum = findAmt("depreciationNonCash");

      const newPropertyStatus = markCompleted ? "Completed" : "In Progress";
      const now = new Date();
      const savedDetails = {
        ...(selectedProperty.revSnap?.detailsJson || {}),
        expenseItems,
        totalExpensesSum,
        userCompleted: markCompleted,
        savedAt: now.toISOString(),
      };

      await savePropertySnapshotsApi(effectiveReviewId, [
        {
          propertyId: selectedProperty.id,
          snapshotPoint: "EOFY",
          valuation: parseNum(eofyValuation, 0),
          weeklyRent: parseNum(eofyRent, 0),
          marketWeeklyRent: parseNum(eofyMarketRent, 0),
          annualGrossRent: parseNum(eofyRent, 0) * 52,
          status: newPropertyStatus,
          detailsJson: savedDetails,
        },
        {
          propertyId: selectedProperty.id,
          snapshotPoint: "REVIEW_DATE",
          valuation: parseNum(reviewValuation, 0),
          weeklyRent: parseNum(reviewRent, 0),
          marketWeeklyRent: parseNum(reviewMarketRent, 0),
          annualGrossRent: parseNum(grossRent, parseNum(reviewRent, 0) * 52),
          councilRates: councilRatesNum,
          waterRates: waterChargesNum,
          insurance: insuranceNum,
          propertyManagementFees: mgmtCommissionsNum,
          repairsMaintenance: repairsMaintenanceNum,
          landTax: landTaxNum,
          strataFees: strataLeviesNum,
          otherExpenses: otherExpensesNum,
          depreciationNonCash: depreciationNum,
          status: newPropertyStatus,
          detailsJson: savedDetails,
        },
      ]);

      setSelectedPropertyStatus(newPropertyStatus);
      setPropertySavedAt(now);

      if (markCompleted) {
        await updateFinDataStatusApi(effectiveReviewId, "COMPLETED");
      }
      await onDataChanged?.();
      setSavingMsg("Saved to database!");
      setTimeout(() => setSavingMsg(""), 2000);
      if (markCompleted) {
        onBackToWorkspace();
      }
    } catch (err) {
      console.error("Failed to save property snapshots:", err);
      setSavingMsg("Failed to save property data");
    }
  };

  const handleSaveLoanSnapshots = async (markCompleted = false) => {
    if (!selectedLoan?.id || !effectiveReviewId) {
      if (markCompleted) onBackToWorkspace();
      return;
    }
    setSavingMsg("Saving loan data to database...");
    const newStatus = markCompleted ? "Completed" : "In Progress";
    const now = new Date();
    try {
      if (householdId) {
        await updateLoanApi(householdId, selectedLoan.id, {
          isClosed: isLoanClosed,
          closedDate: loanClosedDate,
        });
      }
      const savedDetails = {
        ...(selectedLoan.revSnap?.detailsJson || {}),
        userCompleted: markCompleted,
        userSaved: true,
        savedAt: now.toISOString(),
      };

      await saveLoanSnapshotsApi(effectiveReviewId, [
        {
          loanId: selectedLoan.id,
          snapshotPoint: "EOFY",
          loanBalance: parseNum(loanBalanceEofy, 0),
          offsetBalance: parseNum(offsetEofy, 0),
          interestRate: parseNum(interestRateEofy, 0),
          marketRate: parseNum(interestRateMarket, 0),
          status: newStatus,
          detailsJson: savedDetails,
        },
        {
          loanId: selectedLoan.id,
          snapshotPoint: "REVIEW_DATE",
          loanBalance: parseNum(loanBalanceReview, 0),
          offsetBalance: parseNum(offsetReview, 0),
          interestRate: parseNum(interestRateReview, 0),
          marketRate: parseNum(interestRateMarket, 0),
          status: newStatus,
          detailsJson: savedDetails,
        },
      ]);

      setLoanStatus(newStatus);
      setLoanSavedAt(now);

      if (markCompleted) {
        await updateFinDataStatusApi(effectiveReviewId, "COMPLETED");
      }
      await onDataChanged?.();
      setSavingMsg("Saved to database!");
      setTimeout(() => setSavingMsg(""), 2000);
      if (markCompleted) {
        onBackToWorkspace();
      }
    } catch (err) {
      console.error("Failed to save loan snapshots:", err);
      setSavingMsg("Failed to save loan data");
    }
  };

  // Helper Input matching Figma Property Data input boxes (h-[48px] bg-[#F7F8FA] border-[#D8E0E8])
  const renderPropertyField = (
    label: string,
    value: string,
    onChange: (val: string) => void,
    required: boolean = false,
    placeholder: string = "$ Enter amount"
  ) => (
    <div>
      <label className="block text-[13.5px] font-normal text-[#1A1C1E] mb-2 font-['Poppins',sans-serif]">
        {label} {required && <span className="text-[#9AA5B1] ml-0.5">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onFocus={(e) => {
          if (value === "$0" || value === "0") {
            onChange("");
          } else {
            e.target.select();
          }
        }}
        onChange={(e) => onChange(cleanMoneyInput(e.target.value))}
        placeholder={placeholder}
        className="w-full h-[48px] px-3.5 bg-[#F7F8FA] border border-[#D8E0E8] rounded-[8px] text-[13.5px] text-[#1A1C1E] placeholder-[#9AA5B1] focus:bg-white focus:outline-none focus:border-[#0E2841] transition-colors font-['Poppins',sans-serif]"
      />
    </div>
  );

  // Determine whether the 4 pill tabs should be shown
  // In Figma Frames 630:5992 & 625:6863 (Detail views of single Property/Loan), pill tabs are hidden.
  // In Frames 513:9950, 740:7771, 741:9632, 741:10664, pill tabs are displayed.
  const showPillTabs =
    activeTab === "household-income" ||
    activeTab === "market-data" ||
    (activeTab === "property-data" && propertyViewMode === "list") ||
    (activeTab === "loan-data" && loanViewMode === "list");

  return (
    <div className="w-full select-none animate-in fade-in-50 duration-200 font-['Poppins',sans-serif]">
      {/* ========================================================================= */}
      {/* Dynamic Breadcrumbs matching Figma Frames 513:9950, 630:5992, 625:6863    */}
      {/* ========================================================================= */}
      <div className="mb-2.5">
        {activeTab === "household-income" && (
          <button
            type="button"
            onClick={onBackToWorkspace}
            className="flex items-center gap-1.5 text-[13px] text-[#8C9BA8] hover:text-[#071E36] transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 stroke-[1.8]" />
            <span>Back to Household Hub - Review Workspace</span>
          </button>
        )}

        {activeTab === "property-data" && (
          <>
            {propertyViewMode === "detail" ? (
              <button
                type="button"
                onClick={() => setPropertyViewMode("list")}
                className="flex items-center gap-1.5 text-[13px] text-[#64748B] hover:text-[#071E36] transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 stroke-[1.8]" />
                <span>BACK to Fin Data Input - Property Data.</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onBackToWorkspace}
                className="flex items-center gap-1.5 text-[13px] text-[#8C9BA8] hover:text-[#071E36] transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 stroke-[1.8]" />
                <span>ack to Household Hub - Review Workspace</span>
              </button>
            )}
          </>
        )}

        {activeTab === "loan-data" && (
          <>
            {loanViewMode === "detail" ? (
              <button
                type="button"
                onClick={() => setLoanViewMode("list")}
                className="flex items-center gap-1.5 text-[13px] text-[#8C9BA8] hover:text-[#071E36] transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 stroke-[1.8]" />
                <span>Back to Loan Data</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onBackToWorkspace}
                className="flex items-center gap-1.5 text-[13px] text-[#8C9BA8] hover:text-[#071E36] transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 stroke-[1.8]" />
                <span>Back to Household Hub</span>
              </button>
            )}
          </>
        )}

        {activeTab === "market-data" && (
          <button
            type="button"
            onClick={onBackToWorkspace}
            className="flex items-center gap-1.5 text-[13px] text-[#8C9BA8] hover:text-[#071E36] transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 stroke-[1.8]" />
            <span>Back to Household Hub</span>
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* Main Title matching Figma Frames (width="507" height="25", 20px font)     */}
      {/* ========================================================================= */}
      <div className="mb-5">
        <h1 className="text-[20px] leading-[26px] text-[#071E36] tracking-tight">
          <span className="font-bold">Financial data input,</span>{" "}
          <span className="font-normal">{householdName} &nbsp;-- {year}</span>{" "}
          {activeTab === "property-data" && propertyViewMode === "detail" ? (
            <span
              className={
                selectedPropertyStatus === "Completed"
                  ? "text-[#18794E] font-bold"
                  : selectedPropertyStatus === "In Progress"
                  ? "text-[#C66900] font-bold"
                  : "text-[#8C9BA8] font-bold"
              }
            >
              {propertySavedAt && selectedPropertyStatus !== "Not Started"
                ? `${selectedPropertyStatus} – Saved ${formatSavedDateTime(propertySavedAt)}`
                : selectedPropertyStatus}
            </span>
          ) : activeTab === "loan-data" && loanViewMode === "detail" ? (
            <span
              className={
                loanStatus === "Completed"
                  ? "text-[#18794E] font-bold"
                  : loanStatus === "In progress" || loanStatus === "In Progress"
                  ? "text-[#C66900] font-bold"
                  : "text-[#8C9BA8] font-bold"
              }
            >
              {loanSavedAt && loanStatus !== "Not Started"
                ? `${
                    loanStatus === "In progress" ? "In Progress" : loanStatus
                  } – Saved ${formatSavedDateTime(loanSavedAt)}`
                : loanStatus === "In progress"
                ? "In Progress"
                : loanStatus}
            </span>
          ) : (
            <span
              className={
                status === "Completed"
                  ? "text-[#18794E] font-bold"
                  : "text-[#C66900] font-bold"
              }
            >
              {status}
            </span>
          )}
        </h1>
      </div>

      {/* ========================================================================= */}
      {/* 4 Pill Sub-tabs (Figma Views component 515:10725 / 740:7800 / 741:11006)  */}
      {/* ========================================================================= */}
      {showPillTabs && (
        <div className="bg-[#F2F1F3] p-[5px] rounded-[10px] inline-flex items-center gap-[4px] mb-6 max-w-full overflow-x-auto">
          {[
            { id: "household-income" as FinDataTab, label: "Household Income" },
            { id: "property-data" as FinDataTab, label: "Property Data" },
            { id: "loan-data" as FinDataTab, label: "Loan Data" },
            { id: "market-data" as FinDataTab, label: "Market Data" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === "property-data") setPropertyViewMode("list");
                  if (tab.id === "loan-data") setLoanViewMode("list");
                }}
                className={`px-[18px] py-[8px] rounded-[7px] text-[13.5px] transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-white text-[#071E36] shadow-[0px_2px_6px_rgba(0,0,0,0.06)] font-semibold"
                    : "text-[#9AA5B1] hover:text-[#071E36] font-medium"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: Household Income (Figma Frame 513:9950 & Reference Screenshot)      */}
      {/* ========================================================================= */}
      {activeTab === "household-income" && (
        <div className="bg-white rounded-[16px] p-6 sm:p-8 shadow-[0px_2px_12px_rgba(0,0,0,0.03)] border border-[#EDEDF0]">
          {/* Section Heading INSIDE the outer white card matching Figma Frame 617:5699 */}
          <div className="mb-6">
            <h2 className="text-[18px] font-bold text-[#071E36]">
              1. Household Income &amp; Liquidity
            </h2>
            <p className="text-[12px] text-[#071E36] font-normal mt-0.5">
              Annual earned remuneration, superannuation, and distributions for
              household entities in FY2026
            </p>
          </div>

          {/* Remuneration Table (Figma Frame 617:5704) */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[780px]">
              <thead>
                <tr>
                  <th className="py-3.5 px-2 font-medium text-[13.5px] text-[#ACB5BB] w-[22%]">
                    <div className="flex items-center gap-2 cursor-pointer">
                      <span>Client</span>
                      <TableSortArrow />
                    </div>
                  </th>
                  <th className="py-3.5 px-2 font-medium text-[13.5px] text-[#ACB5BB] w-[22%]">
                    <div className="flex items-center gap-2 cursor-pointer">
                      <span>Entity</span>
                      <TableSortArrow />
                    </div>
                  </th>
                  <th className="py-3.5 px-2 font-medium text-[13.5px] text-[#ACB5BB] w-[21%]">
                    <div className="flex items-center gap-2 cursor-pointer">
                      <span>Salary ($)</span>
                      <TableSortArrow />
                    </div>
                  </th>
                  <th className="py-3.5 px-2 font-medium text-[13.5px] text-[#ACB5BB] w-[21%]">
                    <div className="flex items-center gap-2 cursor-pointer">
                      <span>Marginal Tax Rate</span>
                      <TableSortArrow />
                    </div>
                  </th>
                  <th className="py-3.5 px-2 font-medium text-[13.5px] text-[#ACB5BB] w-[14%]">
                    <div className="flex items-center gap-2 cursor-pointer">
                      <span>Super Balance</span>
                      <TableSortArrow />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {salaryRows.map((row) => (
                  <tr key={row.id} className="h-[60px]">
                    <td className="py-2.5 px-2 text-[13.5px] text-[#1A1C1E] font-normal">
                      {row.client}
                    </td>
                    <td className="py-2.5 px-2 text-[13.5px] text-[#1A1C1E] font-normal">
                      {row.entity}
                    </td>
                    <td className="py-2.5 px-2">
                      <input
                        type="text"
                        value={row.salary}
                        onFocus={(e) => {
                          if (row.salary === "$0" || row.salary === "0") {
                            setSalaryRows((prev) =>
                              prev.map((r) =>
                                r.id === row.id ? { ...r, salary: "" } : r
                              )
                            );
                          } else {
                            e.target.select();
                          }
                        }}
                        onChange={(e) => {
                          const val = cleanMoneyInput(e.target.value);
                          setSalaryRows((prev) =>
                            prev.map((r) =>
                              r.id === row.id ? { ...r, salary: val } : r
                            )
                          );
                        }}
                        placeholder="$ Enter amount"
                        className="h-[40px] px-3 bg-[#F7F8FA] border border-[#E2E8F0] rounded-[8px] text-[13px] text-[#1A1C1E] placeholder-[#9AA5B1] w-[134px] focus:bg-white focus:outline-none focus:border-[#0E2841] transition-colors"
                      />
                    </td>
                    <td className="py-2.5 px-2">
                      <input
                        type="text"
                        value={row.taxRate}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSalaryRows((prev) =>
                            prev.map((r) =>
                              r.id === row.id ? { ...r, taxRate: val } : r
                            )
                          );
                        }}
                        placeholder="37%"
                        className="h-[40px] px-3 bg-[#F7F8FA] border border-[#E2E8F0] rounded-[8px] text-[13px] text-[#1A1C1E] placeholder-[#9AA5B1] w-[110px] focus:bg-white focus:outline-none focus:border-[#0E2841] transition-colors"
                      />
                    </td>
                    <td className="py-2.5 px-2">
                      <input
                        type="text"
                        value={row.superAmount}
                        onFocus={(e) => {
                          if (row.superAmount === "$0" || row.superAmount === "0") {
                            setSalaryRows((prev) =>
                              prev.map((r) =>
                                r.id === row.id ? { ...r, superAmount: "" } : r
                              )
                            );
                          } else {
                            e.target.select();
                          }
                        }}
                        onChange={(e) => {
                          const val = cleanMoneyInput(e.target.value);
                          setSalaryRows((prev) =>
                            prev.map((r) =>
                              r.id === row.id ? { ...r, superAmount: val } : r
                            )
                          );
                        }}
                        placeholder="$ Enter amount"
                        className="h-[40px] px-3 bg-[#F7F8FA] border border-[#E2E8F0] rounded-[8px] text-[13px] text-[#1A1C1E] placeholder-[#9AA5B1] w-[136px] focus:bg-white focus:outline-none focus:border-[#0E2841] transition-colors"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Line 93 & Total Row */}
          <div className="mt-4 pt-5 border-t border-[#EDEDF0] grid grid-cols-1 sm:grid-cols-12 items-center gap-4">
            <div className="sm:col-span-5 font-bold text-[#071E36] text-[16px]">
              Total
            </div>
            <div className="sm:col-span-4 font-bold text-[#071E36] text-[14px]">
              Combined Salary: {fmtMoney(combinedSalaryTotal)}
            </div>
            <div className="sm:col-span-3 font-bold text-[#071E36] text-[14px] sm:text-right pr-2">
              Total Super: {fmtMoney(totalSuperSum)}
            </div>
          </div>

          {/* Inner Card 2: Combined Salary & Liquidity */}
          <div className="mt-7 bg-[#F9FAFB]/70 rounded-[16px] p-6 sm:p-8 border border-[#E5E7EB] space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-bold text-[#071E36]">
                Combined Salary: {fmtMoney(combinedSalaryTotal)}
              </h3>
              <div className="flex items-center gap-3">
                {savingMsg && (
                  <span className="text-[13px] text-[#18794E] font-medium">
                    {savingMsg}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleSaveHouseholdIncome}
                  className="h-[40px] px-5 rounded-[8px] bg-[#071E36] hover:bg-[#122D4D] text-white text-[13.5px] font-medium transition-colors cursor-pointer"
                >
                  Save Income &amp; Liquidity
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
              {/* Row 1 Left: Household Expenditure (Figma 651:2516) */}
              <div>
                <label className="block text-[13.5px] font-normal text-[#1A1C1E] mb-2">
                  Household Expenditure
                </label>
                <input
                  type="text"
                  value={householdExpenditure}
                  onFocus={(e) =>
                    handleMoneyFocus(e, householdExpenditure, setHouseholdExpenditure)
                  }
                  onClick={() => {
                    if (householdExpenditure === "$0" || householdExpenditure === "0") {
                      setHouseholdExpenditure("");
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "$" && (householdExpenditure === "$0" || householdExpenditure === "0")) {
                      e.preventDefault();
                      setHouseholdExpenditure("$");
                    }
                  }}
                  onChange={(e) =>
                    setHouseholdExpenditure(cleanMoneyInput(e.target.value))
                  }
                  placeholder="$ Enter amount"
                  className="w-full h-[48px] px-3.5 bg-[#F7F8FA] border border-[#D8E0E8] rounded-[8px] text-[13.5px] text-[#1A1C1E] placeholder-[#9AA5B1] focus:bg-white focus:outline-none focus:border-[#0E2841]"
                />
              </div>

              {/* Row 1 Right: Credit Card Limit (Figma 619:5956) */}
              <div>
                <label className="block text-[13.5px] font-normal text-[#1A1C1E] mb-2">
                  Credit Card Limit
                </label>
                <input
                  type="text"
                  value={creditCardLimit}
                  onFocus={(e) =>
                    handleMoneyFocus(e, creditCardLimit, setCreditCardLimit)
                  }
                  onClick={() => {
                    if (creditCardLimit === "$0" || creditCardLimit === "0") {
                      setCreditCardLimit("");
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "$" && (creditCardLimit === "$0" || creditCardLimit === "0")) {
                      e.preventDefault();
                      setCreditCardLimit("$");
                    }
                  }}
                  onChange={(e) =>
                    setCreditCardLimit(cleanMoneyInput(e.target.value))
                  }
                  placeholder="$ Enter amount"
                  className="w-full h-[48px] px-3.5 bg-[#F7F8FA] border border-[#D8E0E8] rounded-[8px] text-[13.5px] text-[#1A1C1E] placeholder-[#9AA5B1] focus:bg-white focus:outline-none focus:border-[#0E2841]"
                />
              </div>

              {/* Row 2 Left: Other Liabilities (Figma 799:9562) */}
              <div>
                <label className="block text-[13.5px] font-normal text-[#1A1C1E] mb-2">
                  Other Liabilities
                </label>
                <input
                  type="text"
                  value={otherLiabilities}
                  onFocus={(e) =>
                    handleMoneyFocus(e, otherLiabilities, setOtherLiabilities)
                  }
                  onClick={() => {
                    if (otherLiabilities === "$0" || otherLiabilities === "0") {
                      setOtherLiabilities("");
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "$" && (otherLiabilities === "$0" || otherLiabilities === "0")) {
                      e.preventDefault();
                      setOtherLiabilities("$");
                    }
                  }}
                  onChange={(e) =>
                    setOtherLiabilities(cleanMoneyInput(e.target.value))
                  }
                  placeholder="$ Enter amount"
                  className="w-full h-[48px] px-3.5 bg-[#F7F8FA] border border-[#D8E0E8] rounded-[8px] text-[13.5px] text-[#1A1C1E] placeholder-[#9AA5B1] focus:bg-white focus:outline-none focus:border-[#0E2841]"
                />
              </div>

              {/* Row 2 Right: Monthly Payments (Figma 799:9553) */}
              <div>
                <label className="block text-[13.5px] font-normal text-[#1A1C1E] mb-2">
                  Monthly Payments
                </label>
                <input
                  type="text"
                  value={monthlyPayments}
                  onFocus={(e) =>
                    handleMoneyFocus(e, monthlyPayments, setMonthlyPayments)
                  }
                  onClick={() => {
                    if (monthlyPayments === "$0" || monthlyPayments === "0") {
                      setMonthlyPayments("");
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "$" && (monthlyPayments === "$0" || monthlyPayments === "0")) {
                      e.preventDefault();
                      setMonthlyPayments("$");
                    }
                  }}
                  onChange={(e) =>
                    setMonthlyPayments(cleanMoneyInput(e.target.value))
                  }
                  placeholder="$ Enter amount"
                  className="w-full h-[48px] px-3.5 bg-[#F7F8FA] border border-[#D8E0E8] rounded-[8px] text-[13.5px] text-[#1A1C1E] placeholder-[#9AA5B1] focus:bg-white focus:outline-none focus:border-[#0E2841]"
                />
              </div>

              {/* Row 3 Left: Borrowing Capacity (Figma 799:9581) */}
              <div>
                <label className="block text-[13.5px] font-normal text-[#1A1C1E] mb-2">
                  Borrowing Capacity
                </label>
                <input
                  type="text"
                  value={borrowingCapacity}
                  onFocus={(e) =>
                    handleMoneyFocus(e, borrowingCapacity, setBorrowingCapacity)
                  }
                  onClick={() => {
                    if (borrowingCapacity === "$0" || borrowingCapacity === "0") {
                      setBorrowingCapacity("");
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "$" && (borrowingCapacity === "$0" || borrowingCapacity === "0")) {
                      e.preventDefault();
                      setBorrowingCapacity("$");
                    }
                  }}
                  onChange={(e) =>
                    setBorrowingCapacity(cleanMoneyInput(e.target.value))
                  }
                  placeholder="$ Enter amount"
                  className="w-full h-[48px] px-3.5 bg-[#F7F8FA] border border-[#D8E0E8] rounded-[8px] text-[13.5px] text-[#1A1C1E] placeholder-[#9AA5B1] focus:bg-white focus:outline-none focus:border-[#0E2841]"
                />
              </div>

              {/* Row 3 Right: Cash (Figma 799:9572) */}
              <div>
                <label className="block text-[13.5px] font-normal text-[#1A1C1E] mb-2">
                  Cash
                </label>
                <input
                  type="text"
                  value={cash}
                  onFocus={(e) => handleMoneyFocus(e, cash, setCash)}
                  onClick={() => {
                    if (cash === "$0" || cash === "0") {
                      setCash("");
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "$" && (cash === "$0" || cash === "0")) {
                      e.preventDefault();
                      setCash("$");
                    }
                  }}
                  onChange={(e) => setCash(cleanMoneyInput(e.target.value))}
                  placeholder="$ Enter amount"
                  className="w-full h-[48px] px-3.5 bg-[#F7F8FA] border border-[#D8E0E8] rounded-[8px] text-[13.5px] text-[#1A1C1E] placeholder-[#9AA5B1] focus:bg-white focus:outline-none focus:border-[#0E2841]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: Property Data (Figma Frame 630:5992 & Frame 740:7771)              */}
      {/* ========================================================================= */}
      {activeTab === "property-data" && (
        <>
          {/* Detail View (Figma Frame 630:5992) */}
          {propertyViewMode === "detail" ? (
            <div className="space-y-6">
              {/* Card 1: Property Header Card (Figma 630:6045, height=175) */}
              <div className="bg-white rounded-[16px] px-7 py-8 shadow-[0px_2px_12px_rgba(0,0,0,0.03)] border border-[#EDEDF0]">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Left: Property Title + Single-line Address */}
                  <div className="min-w-0">
                    <div className="text-[18px] font-bold text-[#071E36] mb-3">
                      Property
                    </div>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setIsPropertyDropdownOpen(!isPropertyDropdownOpen)
                        }
                        className="text-left hover:opacity-80 transition-opacity cursor-pointer"
                      >
                        <h2 className="text-[18px] font-bold text-[#1A1C1E] whitespace-nowrap">
                          {selectedProperty.address} ({selectedProperty.purpose})
                        </h2>
                      </button>

                      {isPropertyDropdownOpen && (
                        <div className="absolute left-0 top-full mt-2 w-[380px] bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-30">
                          <div className="text-[11px] font-semibold text-[#8C9BA8] px-3 py-1.5 uppercase">
                            Select Property
                          </div>
                          {properties.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setSelectedPropertyId(p.id);
                                setIsPropertyDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-lg text-[13px] flex items-center justify-between transition-colors cursor-pointer ${
                                p.id === selectedProperty.id
                                  ? "bg-[#071E36] text-white font-medium"
                                  : "text-[#1A1C1E] hover:bg-gray-50"
                              }`}
                            >
                              <span className="truncate">{p.address}</span>
                              <span className="text-[11px] ml-2 opacity-80 shrink-0">
                                {p.type}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Stacked Status/Purpose/Type column + Sold Date input (Figma 630:6447) */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-8 lg:gap-12 shrink-0">
                    <div className="text-[13px] leading-[20px] text-[#1A1C1E] space-y-0.5">
                      <div>
                        <span>Status: </span>
                        <span
                          className={`font-bold ${
                            selectedProperty.status === "Completed"
                              ? "text-[#18794E]"
                              : "text-[#C66900]"
                          }`}
                        >
                          {selectedProperty.status}
                        </span>
                      </div>
                      <div>
                        <span>Purpose: </span>
                        <span>{selectedProperty.purpose}</span>
                      </div>
                      <div>
                        <span>Type: </span>
                        <span>{selectedProperty.type}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3.5">
                      <span className="text-[13.5px] font-medium text-[#1A1C1E] whitespace-nowrap">
                        Sold Date
                      </span>
                      <div className="relative">
                        <input
                          ref={soldDateInputRef}
                          type="date"
                          value={toHtmlDateValue(soldDate)}
                          onChange={(e) => setSoldDate(e.target.value)}
                          onClick={() => {
                            try {
                              soldDateInputRef.current?.showPicker();
                            } catch {}
                          }}
                          className="h-[44px] w-[170px] px-3.5 pr-10 bg-white border border-[#E2E8F0] rounded-[8px] text-[13px] text-[#1A1C1E] focus:outline-none focus:border-[#0E2841] cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-10 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => {
                            try {
                              soldDateInputRef.current?.showPicker();
                            } catch {
                              soldDateInputRef.current?.focus();
                            }
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0E2841] transition-colors cursor-pointer"
                        >
                          <Calendar className="w-[18px] h-[18px]" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cards 2 & 3: Two Comparison Cards (Figma 630:6473 & 630:6568) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Card: Valuation & Rents */}
                <div className="bg-white rounded-[16px] p-6 sm:p-7 shadow-[0px_2px_12px_rgba(0,0,0,0.03)] border border-[#EDEDF0]">
                  <div className="pb-4 border-b border-[#F2F3F5]">
                    <h3 className="text-[18px] font-bold text-[#071E36]">
                      Valuation &amp; Rents
                    </h3>
                  </div>

                  <div className="mt-4">
                    <p className="text-[13.5px] font-bold text-[#1A1C1E] mb-2">
                      EOFY Data
                    </p>
                    {renderPropertyField(
                      "Valuation ($)",
                      eofyValuation,
                      setEofyValuation,
                      false,
                      "$ Enter amount"
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-5 mt-5">
                    {renderPropertyField(
                      "Rent (pw) ($)",
                      eofyRent,
                      setEofyRent,
                      false,
                      "$ Enter amount"
                    )}
                    {renderPropertyField(
                      "Market Rent (pw) ($)",
                      eofyMarketRent,
                      setEofyMarketRent,
                      true,
                      "$ Enter amount"
                    )}
                  </div>
                </div>

                {/* Right Card: Review Date Data */}
                <div className="bg-white rounded-[16px] p-6 sm:p-7 shadow-[0px_2px_12px_rgba(0,0,0,0.03)] border border-[#EDEDF0]">
                  <div className="pb-4 border-b border-[#F2F3F5] flex items-center justify-between">
                    <h3 className="text-[18px] font-bold text-[#071E36]">
                      Review Date Data
                    </h3>
                    <span className="text-[12px] text-[#1A1C1E] font-normal">
                      Current Review Comparison
                    </span>
                  </div>

                  <div className="mt-4">
                    {renderPropertyField(
                      "Valuation ($)",
                      reviewValuation,
                      setReviewValuation,
                      false,
                      "$ Enter amount"
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-5 mt-5">
                    {renderPropertyField(
                      "Rent (pw) ($)",
                      reviewRent,
                      setReviewRent,
                      false,
                      "$ Enter amount"
                    )}
                    {renderPropertyField(
                      "Market Rent (pw) ($)",
                      reviewMarketRent,
                      setReviewMarketRent,
                      true,
                      "$ Enter amount"
                    )}
                  </div>
                </div>
              </div>

              {/* Card 4: Tax Return Summary & Expenses (Figma Frame 632:6724 - Separate Card!) */}
              <div className="bg-white rounded-[16px] p-6 sm:p-7 shadow-[0px_2px_12px_rgba(0,0,0,0.03)] border border-[#EDEDF0]">
                <div className="flex items-center justify-between border-b border-[#F2F3F5] pb-4">
                  <h3 className="text-[18px] font-bold text-[#071E36]">
                    Tax Return Summary &amp; Expenses
                  </h3>
                  <div className="text-left leading-[16px]">
                    <div className="text-[12px] text-[#1A1C1E]">
                      Total Outgoings
                    </div>
                    <div className="text-[12px] font-medium text-[#1A1C1E]">
                      {fmtMoney(totalExpensesSum)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-5">
                  {renderPropertyField(
                    "Gross Rent (Item 21)",
                    grossRent,
                    setGrossRent,
                    false,
                    "$ Enter amount"
                  )}
                  {renderPropertyField(
                    "weeks rented",
                    weeksRented,
                    setWeeksRented,
                    false,
                    "52"
                  )}
                </div>
              </div>

              {/* Card 5: Expense Classification Reference Guide */}
              <div className="bg-white rounded-[16px] p-6 sm:p-8 shadow-[0px_2px_12px_rgba(0,0,0,0.03)] border border-[#EDEDF0]">
                {/* Header matching image */}
                <div className="border-b border-[#F0F1F3] pb-4 mb-6">
                  <h3 className="text-[17px] sm:text-[18px] font-bold text-[#071E36] tracking-tight">
                    Expense Classification Reference Guide
                  </h3>
                </div>

                {/* 4 Grouped Category Sections */}
                <div className="space-y-5">
                  {EXPENSE_CATEGORIES_CONFIG.map((catConfig) => {
                    const items = expenseItems.filter(
                      (i) => i.category === catConfig.key
                    );

                    return (
                      <div
                        key={catConfig.key}
                        className="bg-[#F1F3F5] rounded-[14px] p-5 sm:p-6"
                      >
                        <h4 className="text-[14px] sm:text-[15px] font-bold text-[#111827] mb-4">
                          {catConfig.title}
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                          {items.map((item) => (
                            <div
                              key={item.id}
                              className={
                                item.isFullWidth
                                  ? "col-span-1 md:col-span-3"
                                  : "col-span-1"
                              }
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-[13px] font-medium text-[#1A1C1E]">
                                  <span>{item.name}</span>
                                  {item.hasAsterisk && (
                                    <span className="text-[#9AA5B1] ml-1 font-normal">
                                      *
                                    </span>
                                  )}
                                </label>
                                {item.isCustom && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteExpenseItem(item.id)}
                                    title="Delete custom item"
                                    className="text-[#9AA5B1] hover:text-[#DC2626] transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                              <input
                                type="text"
                                value={item.amount}
                                onFocus={(e) =>
                                  handleExpenseAmountFocus(e, item.id, item.amount)
                                }
                                onChange={(e) =>
                                  handleExpenseAmountChange(item.id, e.target.value)
                                }
                                onBlur={(e) =>
                                  handleExpenseAmountBlur(item.id, e.target.value)
                                }
                                placeholder={item.placeholder || "$780"}
                                className="w-full h-[44px] px-3.5 bg-white border border-[#E2E8F0] rounded-[8px] text-[13.5px] text-[#1A1C1E] placeholder-[#ACB5BB] focus:outline-none focus:border-[#071E36] focus:ring-1 focus:ring-[#071E36]/20 transition-all font-['Poppins',sans-serif]"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons matching design (Back on far left, Save & Completed on far right) */}
              <div className="flex items-center justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setPropertyViewMode("list")}
                  className="h-[40px] px-7 rounded-[8px] bg-[#071E36] hover:bg-[#122D4D] text-white text-[13.5px] font-medium transition-colors cursor-pointer shadow-xs"
                >
                  Back
                </button>
                <div className="flex items-center gap-3">
                  {savingMsg && (
                    <span className="text-[13px] text-[#18794E] font-medium">
                      {savingMsg}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSavePropertySnapshots(false)}
                    className="h-[40px] px-7 rounded-[8px] bg-[#071E36] hover:bg-[#122D4D] text-white text-[13.5px] font-medium transition-colors cursor-pointer shadow-xs"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSavePropertySnapshots(true)}
                    className="h-[40px] px-6 rounded-[8px] bg-[#071E36] hover:bg-[#122D4D] text-white text-[13.5px] font-medium transition-colors cursor-pointer shadow-xs"
                  >
                    Completed
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* List View (Figma Frame 740:7771 - Property Data select single property) */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-[18px] font-bold text-[#071E36]">
                    Property Data
                  </h2>
                  <p className="text-[12px] text-[#071E36] font-normal mt-0.5">
                    Valuations, weekly rent, and expenses for FY2026
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPropertyModalOpen(true)}
                  className="bg-[#071E36] hover:bg-[#122D4D] text-white h-[45px] px-[18px] rounded-[8px] text-[13.5px] font-medium flex items-center gap-[8px] transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4 stroke-[2.2]" />
                  <span>ADD NEW PROPERTY</span>
                </button>
              </div>

              <div className="bg-white rounded-[16px] p-6 sm:p-8 shadow-[0px_2px_12px_rgba(0,0,0,0.03)] border border-[#EDEDF0] overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[850px]">
                  <thead>
                    <tr>
                      <th className="py-3 px-3 font-medium text-[13px] text-[#ACB5BB]">
                        <div className="flex items-center gap-1.5">
                          <span>property name</span>
                          <TableSortArrow />
                        </div>
                      </th>
                      <th className="py-3 px-3 font-medium text-[13px] text-[#ACB5BB]">
                        <div className="flex items-center gap-1.5">
                          <span>Type</span>
                          <TableSortArrow />
                        </div>
                      </th>
                      <th className="py-3 px-3 font-medium text-[13px] text-[#ACB5BB]">
                        <div className="flex items-center gap-1.5">
                          <span>Purpose</span>
                          <TableSortArrow />
                        </div>
                      </th>
                      <th className="py-3 px-3 font-medium text-[13px] text-[#ACB5BB]">
                        <div className="flex items-center gap-1.5">
                          <span>Rent</span>
                          <TableSortArrow />
                        </div>
                      </th>
                      <th className="py-3 px-3 font-medium text-[13px] text-[#ACB5BB]">
                        <div className="flex items-center gap-1.5">
                          <span>Review Valuation</span>
                          <TableSortArrow />
                        </div>
                      </th>
                      <th className="py-3 px-3 font-medium text-[13px] text-[#ACB5BB]">
                        <div className="flex items-center gap-1.5">
                          <span>Status</span>
                          <TableSortArrow />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {properties.map((p) => (
                      <tr
                        key={p.id}
                        onClick={() => {
                          setSelectedPropertyId(p.id);
                          setPropertyViewMode("detail");
                        }}
                        className="hover:bg-[#FBFBFC] cursor-pointer transition-colors h-[60px]"
                      >
                        <td className="py-3.5 px-3 text-[13.5px] text-[#1A1C1E]">
                          {p.listName || p.address}
                        </td>
                        <td className="py-3.5 px-3 text-[13.5px] text-[#1A1C1E]">
                          {p.listType || p.type}
                        </td>
                        <td className="py-3.5 px-3 text-[13.5px] text-[#1A1C1E]">
                          {p.purpose}
                        </td>
                        <td className="py-3.5 px-3 text-[13.5px] text-[#1A1C1E]">
                          {p.rentWeekly}
                        </td>
                        <td className="py-3.5 px-3 text-[13.5px] text-[#1A1C1E]">
                          {p.reviewValuation}
                        </td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`underline font-medium text-[13.5px] ${
                              p.status === "Completed"
                                ? "text-[#18794E]"
                                : "text-[#C66900]"
                            }`}
                          >
                            {p.status}
                          </span>
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

      {/* ========================================================================= */}
      {/* TAB 3: Loan Data (Figma Frame 625:6863 & Frame 741:9632)                  */}
      {/* ========================================================================= */}
      {activeTab === "loan-data" && (
        <>
          {/* Detail View (Figma Frame 625:6863 - Matches Reference Screenshot) */}
          {loanViewMode === "detail" ? (
            <div className="space-y-6">
              {/* Card 1: Top Loan Header Card (Figma 625:6980, height=112) */}
              <div className="bg-white rounded-[16px] px-7 py-6 shadow-[0px_2px_12px_rgba(0,0,0,0.03)] border border-[#EDEDF0]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-[18px] font-bold text-[#071E36] mb-2">
                      Loan Reference
                    </div>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setIsLoanDropdownOpen(!isLoanDropdownOpen)
                        }
                        className="text-left hover:opacity-80 transition-opacity cursor-pointer"
                      >
                        <h2 className="text-[18px] font-bold text-[#071E36]">
                          {selectedLoan.title}
                        </h2>
                      </button>

                      {isLoanDropdownOpen && (
                        <div className="absolute left-0 top-full mt-2 w-[400px] bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-30">
                          <div className="text-[11px] font-semibold text-[#8C9BA8] px-3 py-1.5 uppercase">
                            Select Loan Facility
                          </div>
                          {loans.map((l) => (
                            <button
                              key={l.id}
                              type="button"
                              onClick={() => {
                                setSelectedLoanId(l.id);
                                setIsLoanDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-lg text-[13px] flex items-center justify-between transition-colors cursor-pointer ${
                                l.id === selectedLoan.id
                                  ? "bg-[#071E36] text-white font-medium"
                                  : "text-[#1A1C1E] hover:bg-gray-50"
                              }`}
                            >
                              <span className="truncate">{l.title}</span>
                              <span className="text-[11px] ml-2 opacity-80 shrink-0">
                                {l.facilityId}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col sm:items-end gap-1 shrink-0">
                    <span className="text-[13px] text-[#8C9BA8] font-normal">
                      Facility ID: {selectedLoan.facilityId}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Facility Master Specification (Figma 625:7108) */}
              <div className="bg-white rounded-[16px] p-6 sm:p-7 shadow-[0px_2px_12px_rgba(0,0,0,0.03)] border border-[#EDEDF0] space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="text-[18px] font-bold text-[#071E36]">
                    Facility Master Specification
                  </h3>

                  <div className="flex items-center gap-3">
                    <div
                      onClick={() => setIsLoanClosed(!isLoanClosed)}
                      className="flex items-center gap-2.5 cursor-pointer select-none"
                    >
                      <div
                        className={`w-[18px] h-[18px] rounded-[4px] border flex items-center justify-center transition-colors ${
                          isLoanClosed
                            ? "bg-[#1A1C1E] border-[#1A1C1E] text-white"
                            : "border-[#D1D5DB] bg-white"
                        }`}
                      >
                        {isLoanClosed && (
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        )}
                      </div>
                      <span className="text-[13.5px] text-[#1A1C1E] font-medium">
                        Loan closed:
                      </span>
                    </div>
                    <div className="relative flex items-center">
                      <input
                        ref={loanClosedDateInputRef}
                        type="date"
                        value={toHtmlDateValue(loanClosedDate)}
                        onChange={(e) => setLoanClosedDate(e.target.value)}
                        className="sr-only"
                        tabIndex={-1}
                      />
                      <input
                        type="text"
                        value={loanClosedDate}
                        onChange={(e) => setLoanClosedDate(e.target.value)}
                        placeholder="dd-mm-yyyy"
                        className="h-[44px] w-[156px] px-3.5 pr-9 bg-white border border-[#E2E8F0] rounded-[8px] text-[13px] text-[#1A1C1E] placeholder-[#9AA5B1] focus:outline-none focus:border-[#0E2841]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          try {
                            loanClosedDateInputRef.current?.showPicker();
                          } catch {
                            loanClosedDateInputRef.current?.focus();
                          }
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#1A1C1E] hover:text-[#0E2841] transition-colors cursor-pointer"
                        title="Choose date"
                      >
                        <Calendar className="w-[18px] h-[18px]" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Specification Table (Figma 625:7113) */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[950px]">
                    <thead>
                      <tr>
                        <th className="py-3 px-2 font-medium text-[13px] text-[#ACB5BB]">
                          <div className="flex items-center gap-2 cursor-pointer">
                            <span>Lender</span>
                            <TableSortArrow />
                          </div>
                        </th>
                        <th className="py-3 px-2 font-medium text-[13px] text-[#ACB5BB]">
                          <div className="flex items-center gap-2 cursor-pointer">
                            <span>TC&amp;H Loan</span>
                            <TableSortArrow />
                          </div>
                        </th>
                        <th className="py-3 px-2 font-medium text-[13px] text-[#ACB5BB]">
                          <div className="flex items-center gap-2 cursor-pointer">
                            <span>Purpose</span>
                            <TableSortArrow />
                          </div>
                        </th>
                        <th className="py-3 px-2 font-medium text-[13px] text-[#ACB5BB]">
                          <div className="flex items-center gap-2 cursor-pointer">
                            <span>Repayment</span>
                            <TableSortArrow />
                          </div>
                        </th>
                        <th className="py-3 px-2 font-medium text-[13px] text-[#ACB5BB]">
                          <div className="flex items-center gap-2 cursor-pointer">
                            <span>Rate Type</span>
                            <TableSortArrow />
                          </div>
                        </th>
                        <th className="py-3 px-2 font-medium text-[13px] text-[#ACB5BB]">
                          <div className="flex items-center gap-2 cursor-pointer">
                            <span>IO Expiry</span>
                            <TableSortArrow />
                          </div>
                        </th>
                        <th className="py-3 px-2 font-medium text-[13px] text-[#ACB5BB]">
                          <div className="flex items-center gap-2 cursor-pointer">
                            <span>Fixed Expiry</span>
                            <TableSortArrow />
                          </div>
                        </th>
                        <th className="py-3 px-2 font-medium text-[13px] text-[#ACB5BB]">
                          <div className="flex items-center gap-2 cursor-pointer">
                            <span>Maturity</span>
                            <TableSortArrow />
                          </div>
                        </th>
                        <th className="py-3 px-2 font-medium text-[13px] text-[#ACB5BB]">
                          <div className="flex items-center gap-2 cursor-pointer">
                            <span>Security 1</span>
                            <TableSortArrow />
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-4 px-2 text-[13.5px] text-[#1A1C1E] whitespace-nowrap">
                          {selectedLoan.lender}
                        </td>
                        <td className="py-4 px-2 text-[13.5px] text-[#1A1C1E]">
                          yes
                        </td>
                        <td className="py-4 px-2 text-[13.5px] text-[#1A1C1E] whitespace-nowrap">
                          {selectedLoan.purpose}
                        </td>
                        <td className="py-4 px-2 text-[13.5px] text-[#1A1C1E] max-w-[100px] leading-[18px]">
                          {selectedLoan.repayment}
                        </td>
                        <td className="py-4 px-2 text-[13.5px] text-[#1A1C1E]">
                          {selectedLoan.rateType}
                        </td>
                        <td className="py-4 px-2 text-[13.5px] text-[#1A1C1E]">
                          {selectedLoan.ioExpiry}
                        </td>
                        <td className="py-4 px-2 text-[13.5px] text-[#1A1C1E]">
                          {selectedLoan.fixedExpiry}
                        </td>
                        <td className="py-4 px-2 text-[13.5px] text-[#1A1C1E] whitespace-nowrap">
                          {selectedLoan.maturity}
                        </td>
                        <td className="py-4 px-2 text-[13.5px] text-[#1A1C1E] max-w-[160px] leading-[18px]">
                          {selectedLoan.security1}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Card 3: Annual Financial Metrics (Figma 630:5847) */}
              <div className="bg-white rounded-[16px] p-6 sm:p-7 shadow-[0px_2px_12px_rgba(0,0,0,0.03)] border border-[#EDEDF0] space-y-5">
                <div>
                  <h3 className="text-[18px] font-bold text-[#071E36]">
                    Annual Financial Metrics
                  </h3>
                  <p className="text-[12px] text-[#071E36] font-normal mt-0.5">
                    Input EOFY values, review date status, and market benchmark
                    comparison
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr>
                        <th className="py-3 px-2 font-medium text-[13px] text-[#ACB5BB] w-[31%]">
                          <div className="flex items-center gap-2 cursor-pointer">
                            <span>Description</span>
                            <TableSortArrow />
                          </div>
                        </th>
                        <th className="py-3 px-2 font-medium text-[13px] text-[#ACB5BB] w-[26%]">
                          <div className="flex items-center gap-2 cursor-pointer">
                            <span>EOFY</span>
                            <TableSortArrow />
                          </div>
                        </th>
                        <th className="py-3 px-2 font-medium text-[13px] text-[#ACB5BB] w-[27%]">
                          <div className="flex items-center gap-2 cursor-pointer">
                            <span>REVIEW DATE</span>
                            <TableSortArrow />
                          </div>
                        </th>
                        <th className="py-3 px-2 font-medium text-[13px] text-[#ACB5BB] w-[16%]">
                          <div className="flex items-center gap-2 cursor-pointer">
                            <span>CURRENT MARKET RATE</span>
                            <TableSortArrow />
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="h-[56px]">
                        <td className="py-3 px-2 text-[13.5px] text-[#1A1C1E]">
                          Loan Balance
                        </td>
                        <td className="py-3 px-2">
                          <input
                            type="text"
                            value={loanBalanceEofy}
                            placeholder="$ Enter amount"
                            onFocus={(e) => {
                              if (loanBalanceEofy === "$0" || loanBalanceEofy === "0") {
                                setLoanBalanceEofy("");
                              } else {
                                e.target.select();
                              }
                            }}
                            onChange={(e) => setLoanBalanceEofy(cleanMoneyInput(e.target.value))}
                            className="bg-transparent text-[13.5px] text-[#1A1C1E] placeholder-[#9AA5B1] w-[150px] focus:bg-[#F7F8FA] focus:px-2 py-1.5 rounded-[6px] border border-transparent hover:border-[#D8E0E8] focus:border-[#0E2841] focus:outline-none transition-all"
                          />
                        </td>
                        <td className="py-3 px-2">
                          <input
                            type="text"
                            value={loanBalanceReview}
                            placeholder="$ Enter amount"
                            onFocus={(e) => {
                              if (loanBalanceReview === "$0" || loanBalanceReview === "0") {
                                setLoanBalanceReview("");
                              } else {
                                e.target.select();
                              }
                            }}
                            onChange={(e) => setLoanBalanceReview(cleanMoneyInput(e.target.value))}
                            className="bg-transparent text-[13.5px] text-[#1A1C1E] placeholder-[#9AA5B1] w-[150px] focus:bg-[#F7F8FA] focus:px-2 py-1.5 rounded-[6px] border border-transparent hover:border-[#D8E0E8] focus:border-[#0E2841] focus:outline-none transition-all"
                          />
                        </td>
                        <td className="py-3 px-2 text-[13.5px] text-[#1A1C1E]">
                          N/A
                        </td>
                      </tr>

                      <tr className="h-[56px]">
                        <td className="py-3 px-2 text-[13.5px] text-[#1A1C1E]">
                          Interest Rate
                        </td>
                        <td className="py-3 px-2">
                          <input
                            type="text"
                            value={interestRateEofy}
                            placeholder="e.g. 5.94%"
                            onChange={(e) => setInterestRateEofy(e.target.value)}
                            className="bg-transparent text-[13.5px] text-[#1A1C1E] placeholder-[#9AA5B1] w-[130px] focus:bg-[#F7F8FA] focus:px-2 py-1.5 rounded-[6px] border border-transparent hover:border-[#D8E0E8] focus:border-[#0E2841] focus:outline-none transition-all"
                          />
                        </td>
                        <td className="py-3 px-2">
                          <input
                            type="text"
                            value={interestRateReview}
                            placeholder="e.g. 5.94%"
                            onChange={(e) => setInterestRateReview(e.target.value)}
                            className="bg-transparent text-[13.5px] text-[#1A1C1E] placeholder-[#9AA5B1] w-[130px] focus:bg-[#F7F8FA] focus:px-2 py-1.5 rounded-[6px] border border-transparent hover:border-[#D8E0E8] focus:border-[#0E2841] focus:outline-none transition-all"
                          />
                        </td>
                        <td className="py-3 px-2">
                          <input
                            type="text"
                            value={interestRateMarket}
                            placeholder="e.g. 6.05%"
                            onChange={(e) => setInterestRateMarket(e.target.value)}
                            className="bg-transparent text-[13.5px] text-[#1A1C1E] placeholder-[#9AA5B1] w-[130px] focus:bg-[#F7F8FA] focus:px-2 py-1.5 rounded-[6px] border border-transparent hover:border-[#D8E0E8] focus:border-[#0E2841] focus:outline-none transition-all"
                          />
                        </td>
                      </tr>

                      <tr className="h-[56px]">
                        <td className="py-3 px-2 text-[13.5px] text-[#1A1C1E]">
                          Offset Balance
                        </td>
                        <td className="py-3 px-2">
                          <input
                            type="text"
                            value={offsetEofy}
                            placeholder="$ Enter amount"
                            onFocus={(e) => {
                              if (offsetEofy === "$0" || offsetEofy === "0") {
                                setOffsetEofy("");
                              } else {
                                e.target.select();
                              }
                            }}
                            onChange={(e) => setOffsetEofy(cleanMoneyInput(e.target.value))}
                            className="bg-transparent text-[13.5px] text-[#1A1C1E] placeholder-[#9AA5B1] w-[150px] focus:bg-[#F7F8FA] focus:px-2 py-1.5 rounded-[6px] border border-transparent hover:border-[#D8E0E8] focus:border-[#0E2841] focus:outline-none transition-all"
                          />
                        </td>
                        <td className="py-3 px-2">
                          <input
                            type="text"
                            value={offsetReview}
                            placeholder="$ Enter amount"
                            onFocus={(e) => {
                              if (offsetReview === "$0" || offsetReview === "0") {
                                setOffsetReview("");
                              } else {
                                e.target.select();
                              }
                            }}
                            onChange={(e) => setOffsetReview(cleanMoneyInput(e.target.value))}
                            className="bg-transparent text-[13.5px] text-[#1A1C1E] placeholder-[#9AA5B1] w-[150px] focus:bg-[#F7F8FA] focus:px-2 py-1.5 rounded-[6px] border border-transparent hover:border-[#D8E0E8] focus:border-[#0E2841] focus:outline-none transition-all"
                          />
                        </td>
                        <td className="py-3 px-2 text-[13.5px] text-[#1A1C1E]">
                          N/A
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons matching Figma 633:10098 (Back on far left, Save & Completed on far right) */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setLoanViewMode("list")}
                  className="h-[40px] w-[86px] rounded-[8px] border border-[#E2E8F0] bg-white text-[#071E36] hover:bg-gray-50 text-[13.5px] font-medium transition-colors cursor-pointer"
                >
                  Back
                </button>
                <div className="flex items-center gap-4">
                  {savingMsg && (
                    <span className="text-[13px] text-[#18794E] font-medium">
                      {savingMsg}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSaveLoanSnapshots(false)}
                    className="h-[40px] w-[80px] rounded-[8px] border border-[#071E36] bg-white text-[#071E36] hover:bg-gray-50 text-[13.5px] font-medium transition-colors cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveLoanSnapshots(true)}
                    className="h-[40px] w-[123px] rounded-[8px] bg-[#071E36] hover:bg-[#122D4D] text-white text-[13.5px] font-medium transition-colors cursor-pointer shadow-xs"
                  >
                    Completed
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* List View (Figma Frame 741:9632 - Property Data Loan Data list) */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-[18px] font-bold text-[#071E36]">
                    Loan Data
                  </h2>
                  <p className="text-[12px] text-[#071E36] font-normal mt-0.5">
                    EOFY vs review balances, interest pricing, and offset cash
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsLoanModalOpen(true)}
                  className="bg-[#071E36] hover:bg-[#122D4D] text-white h-[45px] px-[18px] rounded-[8px] text-[13.5px] font-medium flex items-center gap-[8px] transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4 stroke-[2.2]" />
                  <span>Add New Loan</span>
                </button>
              </div>

              <div className="bg-white rounded-[16px] p-6 sm:p-8 shadow-[0px_2px_12px_rgba(0,0,0,0.03)] border border-[#EDEDF0] overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[950px]">
                  <thead>
                    <tr>
                      <th className="py-3 px-3 font-medium text-[13px] text-[#ACB5BB]">
                        <div className="flex items-center gap-1.5">
                          <span>Lender</span>
                          <TableSortArrow />
                        </div>
                      </th>
                      <th className="py-3 px-3 font-medium text-[13px] text-[#ACB5BB]">
                        <div className="flex items-center gap-1.5">
                          <span>Loan Reference</span>
                          <TableSortArrow />
                        </div>
                      </th>
                      <th className="py-3 px-3 font-medium text-[13px] text-[#ACB5BB]">
                        <div className="flex items-center gap-1.5">
                          <span>Purpose</span>
                          <TableSortArrow />
                        </div>
                      </th>
                      <th className="py-3 px-3 font-medium text-[13px] text-[#ACB5BB]">
                        <div className="flex items-center gap-1.5">
                          <span>Interest Rate</span>
                          <TableSortArrow />
                        </div>
                      </th>
                      <th className="py-3 px-3 font-medium text-[13px] text-[#ACB5BB]">
                        <div className="flex items-center gap-1.5">
                          <span>Repayment</span>
                          <TableSortArrow />
                        </div>
                      </th>
                      <th className="py-3 px-3 font-medium text-[13px] text-[#ACB5BB]">
                        <div className="flex items-center gap-1.5">
                          <span>Offset</span>
                          <TableSortArrow />
                        </div>
                      </th>
                      <th className="py-3 px-3 font-medium text-[13px] text-[#ACB5BB]">
                        <div className="flex items-center gap-1.5">
                          <span>Review Balance</span>
                          <TableSortArrow />
                        </div>
                      </th>
                      <th className="py-3 px-3 font-medium text-[13px] text-[#ACB5BB]">
                        <div className="flex items-center gap-1.5">
                          <span>Status</span>
                          <TableSortArrow />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loans.map((l) => (
                      <tr
                        key={l.id}
                        onClick={() => {
                          setSelectedLoanId(l.id);
                          setLoanViewMode("detail");
                        }}
                        className="hover:bg-[#FBFBFC] cursor-pointer transition-colors h-[60px]"
                      >
                        <td className="py-3.5 px-3 text-[13.5px] text-[#1A1C1E]">
                          {l.lender}
                        </td>
                        <td className="py-3.5 px-3 text-[13.5px] text-[#1A1C1E]">
                          {l.facilityId}
                        </td>
                        <td className="py-3.5 px-3 text-[13.5px] text-[#1A1C1E]">
                          {l.purpose}
                        </td>
                        <td className="py-3.5 px-3 text-[13.5px] text-[#1A1C1E]">
                          {l.interestReview}
                        </td>
                        <td className="py-3.5 px-3 text-[13.5px] text-[#1A1C1E]">
                          {l.repayment}
                        </td>
                        <td className="py-3.5 px-3 text-[13.5px] text-[#1A1C1E]">
                          {l.offsetReview}
                        </td>
                        <td className="py-3.5 px-3 text-[13.5px] text-[#1A1C1E]">
                          {l.reviewBalance}
                        </td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`underline font-medium text-[13.5px] ${
                              l.status === "Completed"
                                ? "text-[#18794E]"
                                : "text-[#C66900]"
                            }`}
                          >
                            {l.status}
                          </span>
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

      {/* ========================================================================= */}
      {/* TAB 4: Market Data (Figma Frame 741:10664 & Reference Screenshot)         */}
      {/* ========================================================================= */}
      {activeTab === "market-data" && (
        <div className="space-y-6">
          {/* Card 1: Suburb data (Figma 620:6695) */}
          <div className="bg-white rounded-[16px] p-6 sm:p-8 shadow-[0px_2px_12px_rgba(0,0,0,0.03)] border border-[#EDEDF0] space-y-5">
            <div>
              <h3 className="text-[18px] font-bold text-[#071E36]">
                Suburb data
              </h3>
              <p className="text-[12px] text-[#071E36] font-normal mt-0.5">
                Economic and market benchmark rates applied to advisory models
                for FY2026
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="h-[52px]">
                    <th className="py-2.5 px-3 font-semibold text-[13px] text-[#7E8B97] w-[51%]">
                      Property
                    </th>
                    <th className="py-2.5 px-3 font-semibold text-[13px] text-[#7E8B97] w-[39%]">
                      Postcode
                    </th>
                    <th className="py-2.5 px-3 font-semibold text-[13px] text-[#7E8B97] w-[10%]">
                      EOFY
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {properties.map((p) => (
                    <tr key={p.id} className="h-[52px]">
                      <td className="py-2.5 px-3 text-[13.5px] text-[#1A1C1E]">
                        {p.address}
                      </td>
                      <td className="py-2.5 px-3 text-[13.5px] text-[#1A1C1E]">
                        {p.rawProperty?.postcode || "2000"}
                      </td>
                      <td className="py-2.5 px-3 text-[13.5px] text-[#1A1C1E]">
                        30/06/{year}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Card 2: Market Data (Figma 991:9443) — Driven by System Settings (Include in Review Workspace – Market Data) */}
          <div className="bg-white rounded-[16px] p-6 sm:p-8 shadow-[0px_2px_12px_rgba(0,0,0,0.03)] border border-[#EDEDF0] space-y-5">
            <div>
              <h3 className="text-[18px] font-bold text-[#071E36]">
                Market Data
              </h3>
              <p className="text-[12px] text-[#071E36] font-normal mt-0.5">
                Economic and market benchmark rates applied to advisory models
                for FY{year}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="h-[52px]">
                    <th className="py-2.5 px-3 font-semibold text-[13px] text-[#7E8B97]">
                      Benchmark Metric
                    </th>
                    <th className="py-2.5 px-3 font-semibold text-[13px] text-[#7E8B97]">
                      Definition
                    </th>
                    <th className="py-2.5 px-3 font-semibold text-[13px] text-[#7E8B97]">
                      Assessment Dates
                    </th>
                    {(properties.length > 0
                      ? properties
                      : [
                          {
                            id: "p1",
                            address: "22 Oak Avenue",
                            purchaseDate: "16/06/2015",
                          },
                          {
                            id: "p2",
                            address: "15 Sunview parade",
                            purchaseDate: "16/06/2015",
                          },
                          {
                            id: "p3",
                            address: "8 pacific Drive",
                            purchaseDate: "16/06/2015",
                          },
                        ]
                    ).map((prop: any) => (
                      <th
                        key={prop.id}
                        className="py-2.5 px-3 font-semibold text-[13px] text-[#7E8B97]"
                      >
                        <div>{prop.address}</div>
                        <div className="text-[12px] text-[#9AA5B1] font-normal">
                          {prop.purchaseDate || "16/06/2015"}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {systemBenchmarks
                    .filter((bm: any) => bm.includeInMarketData)
                    .map((bm: any) => {
                      const hvs = Array.isArray(bm.historicalValues)
                        ? bm.historicalValues
                        : [];
                      const latestHv =
                        hvs.length > 0 ? hvs[hvs.length - 1] : null;
                      const latestDate = latestHv?.date || `30/06/${year}`;
                      const latestValue = latestHv?.value || "20,160";
                      const defLabel =
                        Array.isArray(bm.picfoMetrics) &&
                        bm.picfoMetrics.length > 0
                          ? bm.picfoMetrics.join(", ")
                          : bm.equity;
                      const displayProps =
                        properties.length > 0
                          ? properties
                          : [{ id: "p1" }, { id: "p2" }, { id: "p3" }];
                      return (
                        <tr key={bm.id} className="h-[52px]">
                          <td className="py-2.5 px-3 text-[13.5px] text-[#1A1C1E] whitespace-nowrap">
                            {bm.measure}
                          </td>
                          <td className="py-2.5 px-3 text-[13.5px] text-[#1A1C1E] whitespace-nowrap">
                            {defLabel}
                          </td>
                          <td className="py-2.5 px-3 text-[13.5px] text-[#1A1C1E]">
                            {latestDate}
                          </td>
                          {displayProps.map((prop: any) => (
                            <td
                              key={prop.id}
                              className="py-2.5 px-3 text-[13.5px] text-[#1A1C1E]"
                            >
                              {latestValue}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Button -> Navigates to System Settings (/settings) */}
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => router.push("/settings")}
              className="h-[40px] w-[232px] bg-[#071E36] hover:bg-[#122D4D] text-white text-[13.5px] font-medium rounded-[8px] flex items-center justify-center transition-colors shadow-xs cursor-pointer"
            >
              Configure in Settings
            </button>
          </div>
        </div>
      )}

      {/* Add Property Modal from List view */}
      <AddPropertyModal
        isOpen={isPropertyModalOpen}
        onClose={() => setIsPropertyModalOpen(false)}
        availableEntities={
          Array.isArray(dbHousehold?.entities)
            ? dbHousehold.entities.map((e: any) => ({
                id: e.id,
                name: e.name,
                type: e.displayType || e.type,
              }))
            : []
        }
        onAddProperty={async (newP: NewPropertyFormPayload) => {
          if (householdId) {
            const fullAddress =
              newP.address.includes(newP.state) ||
              newP.address.includes(newP.postcode)
                ? newP.address
                : `${newP.address}, ${newP.state} ${newP.postcode}`;
            await createPropertyApi(householdId, {
              name: fullAddress,
              address: fullAddress,
              state: newP.state,
              postcode: newP.postcode,
              propertyCategory: newP.type,
              purposeDisplay: newP.purpose,
              type: newP.purpose,
              purchaseDateStr: newP.purchaseDate,
              purchasePrice: parseNum(newP.purchasePrice, 800000),
              acquisitionCosts: parseNum(newP.purchaseCosts, 45936),
              currentValuation: parseNum(newP.purchasePrice, 800000),
              weeklyRent: parseNum(newP.rentWeekly, 850),
              landSize: newP.landSize,
              beds: newP.beds,
              baths: newP.baths,
              cars: newP.cars,
              owner1: newP.owner1,
              owner1Pct: newP.owner1Pct,
              owner2: newP.owner2,
              owner2Pct: newP.owner2Pct,
              ownersJson: {
                livingArea: newP.livingArea,
                additionalPersons: newP.additionalPersons,
              },
            });
            await onDataChanged?.();
          }
        }}
      />

      {/* Add Loan Modal from List view */}
      <AddLoanModal
        isOpen={isLoanModalOpen}
        onClose={() => setIsLoanModalOpen(false)}
        availableProperties={properties.map((p) => p.address)}
        onAddLoan={async (newL: NewLoanFormPayload) => {
          if (householdId) {
            await createLoanApi(householdId, {
              lender: newL.lender,
              loanReference: newL.loanReference,
              isTchLoan: newL.isTchLoan,
              purpose: newL.purpose,
              repaymentType: newL.repaymentType,
              rateType: newL.loanType,
              ioExpiry: newL.ioExpiry,
              fixedExpiry: newL.fixedExpiry,
              maturityDate: newL.maturityDate,
              security1: newL.security1,
              security2: newL.security2,
              security3: newL.security3,
              loanBalance: parseNum(newL.balance, 650000),
              offsetBalance: parseNum(newL.offsetBalance, 24000),
              interestRate: parseNum(newL.rate, 5.94),
            });
            await onDataChanged?.();
          }
        }}
      />
    </div>
  );
}
