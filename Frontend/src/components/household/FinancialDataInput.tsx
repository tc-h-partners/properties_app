"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Calendar,
  Check,
  ChevronLeft,
  Plus,
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
  status = "Completed",
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
      status: "In Progress",
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
      eofyBalance: "$0",
      reviewBalance: "$0",
      marketRate: "N/A",
      interestEofy: "5.95%",
      interestReview: "5.95%",
      interestMarket: "6.05%",
      offsetEofy: "$0",
      offsetReview: "$0",
      status: "In progress",
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
  const [cash, setCash] = useState("$47,000");
  const [borrowingCapacity, setBorrowingCapacity] = useState("$800,000");

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
        return {
          id: e.id,
          client: e.name,
          entity: e.displayType || e.type || "Individual",
          salary: fmtMoney(e.annualSalary ?? 0),
          taxRate: pct,
          superAmount: fmtMoney(e.superBalance ?? 0),
        };
      })
    );

    setHouseholdExpenditure(
      dbHousehold.householdExpenditure
        ? fmtMoney(dbHousehold.householdExpenditure)
        : ""
    );
    setCreditCardLimit(
      dbHousehold.creditCardLimit ? fmtMoney(dbHousehold.creditCardLimit) : ""
    );
    setOtherLiabilities(
      dbHousehold.otherLiabilities ? fmtMoney(dbHousehold.otherLiabilities) : ""
    );
    setMonthlyPayments(
      dbHousehold.monthlyPayments ? fmtMoney(dbHousehold.monthlyPayments) : ""
    );
    setBorrowingCapacity(fmtMoney(dbHousehold.borrowingCapacity ?? 800000));
    setCash(fmtMoney(dbHousehold.cashSavings ?? 47000));

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
        status: (revSnap?.status || "Completed") as "Completed" | "In Progress",
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
        const eofyRate = eofySnap ? Number(eofySnap.interestRate) : 0.0614;
        const revRate = revSnap ? Number(revSnap.interestRate) : 0.0594;
        const mktRate = revSnap?.marketRate ? Number(revSnap.marketRate) : 0.0605;

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
          eofyBalance: fmtMoney(eofySnap ? eofySnap.loanBalance : 650000),
          reviewBalance: fmtMoney(revSnap ? revSnap.loanBalance : 650000),
          marketRate: "N/A",
          interestEofy: `${((eofyRate <= 1 ? eofyRate * 100 : eofyRate)).toFixed(2)}%`,
          interestReview: `${((revRate <= 1 ? revRate * 100 : revRate)).toFixed(2)}%`,
          interestMarket: `${((mktRate <= 1 ? mktRate * 100 : mktRate)).toFixed(2)}%`,
          offsetEofy: fmtMoney(eofySnap ? eofySnap.offsetBalance : 20000),
          offsetReview: fmtMoney(revSnap ? revSnap.offsetBalance : 24000),
          status: (revSnap?.status || "Completed") as "Completed" | "In progress",
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
  const [soldDate, setSoldDate] = useState("");
  const [eofyValuation, setEofyValuation] = useState("$840000");
  const [eofyRent, setEofyRent] = useState("$780");
  const [eofyMarketRent, setEofyMarketRent] = useState("$840");
  const [reviewValuation, setReviewValuation] = useState("$840000");
  const [reviewRent, setReviewRent] = useState("$780");
  const [reviewMarketRent, setReviewMarketRent] = useState("$840");
  const [grossRent, setGrossRent] = useState("$40,560");
  const [weeksRented, setWeeksRented] = useState("$40,560");

  // Property Management $
  const [mgmtCommissions, setMgmtCommissions] = useState("$780");
  const [lettingFees, setLettingFees] = useState("$840");
  const [leaseRenewal, setLeaseRenewal] = useState("$780");
  const [marketing, setMarketing] = useState("$780");
  const [routineInspection, setRoutineInspection] = useState("$840");

  // Property Operating Costs
  const [councilRates, setCouncilRates] = useState("$780");
  const [insurance, setInsurance] = useState("$840");
  const [pestControl, setPestControl] = useState("$780");
  const [strataLevies, setStrataLevies] = useState("$780");
  const [waterCharges, setWaterCharges] = useState("$840");
  const [repairsMaintenance, setRepairsMaintenance] = useState("$840");
  const [operatingTotal, setOperatingTotal] = useState("$780");

  // Government & Statutory Charges
  const [landTax, setLandTax] = useState("$780");
  const [municipalLevies, setMunicipalLevies] = useState("$840");
  const [complianceInspection, setComplianceInspection] = useState("$780");
  const [govTotal, setGovTotal] = useState("$780");

  // Finance Cost
  const [mortgageInterest, setMortgageInterest] = useState("$780");
  const [annualPackageFees, setAnnualPackageFees] = useState("$840");
  const [debtServiceCharges, setDebtServiceCharges] = useState("$780");
  const [netTaxableRentalIncome, setNetTaxableRentalIncome] = useState("$780");
  const [otherExpenses, setOtherExpenses] = useState("$840");
  const [netRentTaxReturn, setNetRentTaxReturn] = useState("$780");
  const [financeTotal, setFinanceTotal] = useState("$780");
  const [depreciation, setDepreciation] = useState("Depreciation.....");

  // =========================================================================
  // TAB 3: Loan Data State (Figma Frame 625:6863)
  // =========================================================================
  const [isLoanClosed, setIsLoanClosed] = useState(true);
  const [loanClosedDate, setLoanClosedDate] = useState("");
  const [loanBalanceEofy, setLoanBalanceEofy] = useState("$742000");
  const [loanBalanceReview, setLoanBalanceReview] = useState("$720000");
  const [interestRateEofy, setInterestRateEofy] = useState("6.14%");
  const [interestRateReview, setInterestRateReview] = useState("5.94%");
  const [interestRateMarket, setInterestRateMarket] = useState("6.05%");
  const [offsetEofy, setOffsetEofy] = useState("$24,000");
  const [offsetReview, setOffsetReview] = useState("$32,000");

  // Populate Property Detail form inputs whenever selectedProperty changes
  useEffect(() => {
    if (!selectedProperty || !selectedProperty.id) return;
    const eofy = selectedProperty.eofySnap;
    const rev = selectedProperty.revSnap;
    const raw = selectedProperty.rawProperty;

    setSoldDate(raw?.soldDate || "");
    setEofyValuation(fmtMoney(eofy ? eofy.valuation : raw?.purchasePrice ?? 840000));
    setEofyRent(fmtMoney(eofy ? eofy.weeklyRent : raw?.weeklyRent ?? 780));
    setEofyMarketRent(fmtMoney(eofy?.marketWeeklyRent || eofy?.weeklyRent || 840));

    setReviewValuation(
      fmtMoney(rev ? rev.valuation : raw?.currentValuation ?? raw?.purchasePrice ?? 840000)
    );
    setReviewRent(fmtMoney(rev ? rev.weeklyRent : raw?.weeklyRent ?? 780));
    setReviewMarketRent(fmtMoney(rev?.marketWeeklyRent || rev?.weeklyRent || 840));
    setGrossRent(fmtMoney(rev ? rev.annualGrossRent : (raw?.weeklyRent ?? 780) * 52));
    setWeeksRented(String(52 - Number(rev?.vacancyWeeks ?? 0)));

    setMgmtCommissions(fmtMoney(rev?.propertyManagementFees ?? 780));
    setCouncilRates(fmtMoney(rev?.councilRates ?? 780));
    setInsurance(fmtMoney(rev?.insurance ?? 840));
    setStrataLevies(fmtMoney(rev?.strataFees ?? 780));
    setWaterCharges(fmtMoney(rev?.waterRates ?? 840));
    setRepairsMaintenance(fmtMoney(rev?.repairsMaintenance ?? 840));
    setLandTax(fmtMoney(rev?.landTax ?? 780));
    setOtherExpenses(fmtMoney(rev?.otherExpenses ?? 840));
    setDepreciation(fmtMoney(rev?.depreciationNonCash ?? 6500));
  }, [selectedProperty?.id]);

  // Populate Loan Detail form inputs whenever selectedLoan changes
  useEffect(() => {
    if (!selectedLoan || !selectedLoan.id) return;
    setIsLoanClosed(Boolean(selectedLoan.isClosed));
    setLoanClosedDate(selectedLoan.closedDate || "");
    setLoanBalanceEofy(selectedLoan.eofyBalance || "$650,000");
    setLoanBalanceReview(selectedLoan.reviewBalance || "$650,000");
    setInterestRateEofy(selectedLoan.interestEofy || "6.14%");
    setInterestRateReview(selectedLoan.interestReview || "5.94%");
    setInterestRateMarket(selectedLoan.interestMarket || "6.05%");
    setOffsetEofy(selectedLoan.offsetEofy || "$20,000");
    setOffsetReview(selectedLoan.offsetReview || "$24,000");
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
          borrowingCapacity: parseNum(borrowingCapacity, 800000),
          cashSavings: parseNum(cash, 47000),
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
      await savePropertySnapshotsApi(effectiveReviewId, [
        {
          propertyId: selectedProperty.id,
          snapshotPoint: "EOFY",
          valuation: parseNum(eofyValuation, 840000),
          weeklyRent: parseNum(eofyRent, 780),
          marketWeeklyRent: parseNum(eofyMarketRent, 840),
          annualGrossRent: parseNum(eofyRent, 780) * 52,
          status: "Completed",
        },
        {
          propertyId: selectedProperty.id,
          snapshotPoint: "REVIEW_DATE",
          valuation: parseNum(reviewValuation, 840000),
          weeklyRent: parseNum(reviewRent, 780),
          marketWeeklyRent: parseNum(reviewMarketRent, 840),
          annualGrossRent: parseNum(grossRent, parseNum(reviewRent, 780) * 52),
          councilRates: parseNum(councilRates, 780),
          waterRates: parseNum(waterCharges, 840),
          insurance: parseNum(insurance, 840),
          propertyManagementFees: parseNum(mgmtCommissions, 780),
          repairsMaintenance: parseNum(repairsMaintenance, 840),
          landTax: parseNum(landTax, 780),
          strataFees: parseNum(strataLevies, 780),
          otherExpenses: parseNum(otherExpenses, 840),
          depreciationNonCash: parseNum(depreciation, 6500),
          status: "Completed",
        },
      ]);

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
    try {
      if (householdId) {
        await updateLoanApi(householdId, selectedLoan.id, {
          isClosed: isLoanClosed,
          closedDate: loanClosedDate,
        });
      }
      await saveLoanSnapshotsApi(effectiveReviewId, [
        {
          loanId: selectedLoan.id,
          snapshotPoint: "EOFY",
          loanBalance: parseNum(loanBalanceEofy, 650000),
          offsetBalance: parseNum(offsetEofy, 20000),
          interestRate: parseNum(interestRateEofy, 6.14),
          marketRate: parseNum(interestRateMarket, 6.05),
          status: "Completed",
        },
        {
          loanId: selectedLoan.id,
          snapshotPoint: "REVIEW_DATE",
          loanBalance: parseNum(loanBalanceReview, 650000),
          offsetBalance: parseNum(offsetReview, 24000),
          interestRate: parseNum(interestRateReview, 5.94),
          marketRate: parseNum(interestRateMarket, 6.05),
          status: "Completed",
        },
      ]);

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
    placeholder: string = "$780"
  ) => (
    <div>
      <label className="block text-[13.5px] font-normal text-[#1A1C1E] mb-2 font-['Poppins',sans-serif]">
        {label} {required && <span className="text-[#9AA5B1] ml-0.5">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-[48px] px-3.5 bg-[#F7F8FA] border border-[#D8E0E8] rounded-[8px] text-[13.5px] text-[#8C9BA8] placeholder-[#9AA5B1] focus:text-[#1A1C1E] focus:bg-white focus:outline-none focus:border-[#0E2841] transition-colors font-['Poppins',sans-serif]"
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
            <span>ack to Household Hub - Review Workspace</span>
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
        {activeTab === "household-income" ? (
          <h1 className="text-[20px] leading-[26px] font-bold text-[#071E36] tracking-tight">
            FInancial data input, {householdName} &nbsp;-- {year} {status}
          </h1>
        ) : (
          <h1 className="text-[20px] leading-[26px] text-[#071E36] tracking-tight">
            <span className="font-bold">
              {activeTab === "market-data"
                ? "Financial data input,"
                : "FInancial data input,"}
            </span>{" "}
            <span className="font-normal">{householdName} &nbsp;-- {year}</span>{" "}
            <span
              className={
                status === "Completed"
                  ? "text-[#18794E] font-bold"
                  : "text-[#C66900] font-bold"
              }
            >
              {status}
            </span>
          </h1>
        )}
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
                      <span>Super ($)</span>
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
                        onChange={(e) => {
                          const val = e.target.value;
                          setSalaryRows((prev) =>
                            prev.map((r) =>
                              r.id === row.id ? { ...r, salary: val } : r
                            )
                          );
                        }}
                        className="h-[40px] px-3 bg-[#F7F8FA] border border-[#E2E8F0] rounded-[8px] text-[13px] text-[#1A1C1E] w-[134px] focus:bg-white focus:outline-none focus:border-[#0E2841] transition-colors"
                      />
                    </td>
                    <td className="py-2.5 px-2">
                      <input
                        type="text"
                        value={row.taxRate}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSalaryRows((prev) =>
                            prev.map((r) =>
                              r.id === row.id ? { ...r, taxRate: val } : r
                            )
                          );
                        }}
                        className="h-[40px] px-3 bg-[#F7F8FA] border border-[#E2E8F0] rounded-[8px] text-[13px] text-[#1A1C1E] w-[110px] focus:bg-white focus:outline-none focus:border-[#0E2841] transition-colors"
                      />
                    </td>
                    <td className="py-2.5 px-2">
                      <input
                        type="text"
                        value={row.superAmount}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSalaryRows((prev) =>
                            prev.map((r) =>
                              r.id === row.id ? { ...r, superAmount: val } : r
                            )
                          );
                        }}
                        className="h-[40px] px-3 bg-[#F7F8FA] border border-[#E2E8F0] rounded-[8px] text-[13px] text-[#1A1C1E] w-[136px] focus:bg-white focus:outline-none focus:border-[#0E2841] transition-colors"
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
                  onChange={(e) => setHouseholdExpenditure(e.target.value)}
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
                  onChange={(e) => setCreditCardLimit(e.target.value)}
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
                  onChange={(e) => setOtherLiabilities(e.target.value)}
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
                  onChange={(e) => setMonthlyPayments(e.target.value)}
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
                  onChange={(e) => setBorrowingCapacity(e.target.value)}
                  placeholder="$800,000"
                  className="w-full h-[48px] px-3.5 bg-[#F7F8FA] border border-[#D8E0E8] rounded-[8px] text-[13.5px] text-[#8C9BA8] placeholder-[#9AA5B1] focus:text-[#1A1C1E] focus:bg-white focus:outline-none focus:border-[#0E2841]"
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
                  onChange={(e) => setCash(e.target.value)}
                  placeholder="$47,000"
                  className="w-full h-[48px] px-3.5 bg-[#F7F8FA] border border-[#D8E0E8] rounded-[8px] text-[13.5px] text-[#8C9BA8] placeholder-[#9AA5B1] focus:text-[#1A1C1E] focus:bg-white focus:outline-none focus:border-[#0E2841]"
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
                        <span className="text-[#18794E] font-bold">
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
                          type="text"
                          value={soldDate}
                          onChange={(e) => setSoldDate(e.target.value)}
                          placeholder="dd-mm-yyyy"
                          className="h-[44px] w-[156px] px-3.5 pr-9 bg-white border border-[#E2E8F0] rounded-[8px] text-[13px] text-[#1A1C1E] placeholder-[#9AA5B1] focus:outline-none focus:border-[#0E2841]"
                        />
                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#64748B] pointer-events-none" />
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
                      "$840000"
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-5 mt-5">
                    {renderPropertyField(
                      "Rent (pw) ($)",
                      eofyRent,
                      setEofyRent,
                      false,
                      "$780"
                    )}
                    {renderPropertyField(
                      "Market Rent (pw) ($)",
                      eofyMarketRent,
                      setEofyMarketRent,
                      true,
                      "$840"
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
                      "$840000"
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-5 mt-5">
                    {renderPropertyField(
                      "Rent (pw) ($)",
                      reviewRent,
                      setReviewRent,
                      false,
                      "$780"
                    )}
                    {renderPropertyField(
                      "Market Rent (pw) ($)",
                      reviewMarketRent,
                      setReviewMarketRent,
                      true,
                      "$840"
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
                      $50,779
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-5">
                  {renderPropertyField(
                    "Gross Rent (Item 21)",
                    grossRent,
                    setGrossRent,
                    false,
                    "$40,560"
                  )}
                  {renderPropertyField(
                    "weeks rented",
                    weeksRented,
                    setWeeksRented,
                    false,
                    "$40,560"
                  )}
                </div>
              </div>

              {/* Card 5: Expense Classification Reference Guide (Figma Frame 633:6848 - Separate Card!) */}
              <div className="bg-white rounded-[16px] p-6 sm:p-7 shadow-[0px_2px_12px_rgba(0,0,0,0.03)] border border-[#EDEDF0] space-y-6">
                <div className="border-b border-[#F2F3F5] pb-4 w-[542px] max-w-full">
                  <h3 className="text-[18px] font-bold text-[#071E36]">
                    Expense Classification Reference Guide
                  </h3>
                </div>

                {/* Section 1: Property Management $ (Figma 633:6916) */}
                <div className="bg-[#FBFBFC] border border-[#F0F1F3] rounded-[12px] p-5 space-y-4">
                  <div className="border-b border-[#E5E7EB] pb-2.5 w-[496px] max-w-full">
                    <h4 className="text-[14px] font-bold text-[#071E36]">
                      Property Management $
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {renderPropertyField(
                      "Management commissions",
                      mgmtCommissions,
                      setMgmtCommissions
                    )}
                    {renderPropertyField(
                      "Letting fees",
                      lettingFees,
                      setLettingFees,
                      true,
                      "$840"
                    )}
                    {renderPropertyField(
                      "Lease renewal charges",
                      leaseRenewal,
                      setLeaseRenewal
                    )}
                    {renderPropertyField("Marketing", marketing, setMarketing)}
                    {renderPropertyField(
                      "Routine inspection costs",
                      routineInspection,
                      setRoutineInspection,
                      true,
                      "$840"
                    )}
                  </div>
                </div>

                {/* Section 2: Property Operating Costs (Figma 741:9392) */}
                <div className="bg-[#FBFBFC] border border-[#F0F1F3] rounded-[12px] p-5 space-y-4">
                  <div className="border-b border-[#E5E7EB] pb-2.5 w-[496px] max-w-full">
                    <h4 className="text-[14px] font-bold text-[#071E36]">
                      Property Operating Costs
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {renderPropertyField(
                      "Council rates",
                      councilRates,
                      setCouncilRates
                    )}
                    {renderPropertyField(
                      "Landlord / building insurance",
                      insurance,
                      setInsurance,
                      true,
                      "$840"
                    )}
                    {renderPropertyField(
                      "Pest control",
                      pestControl,
                      setPestControl
                    )}
                    {renderPropertyField(
                      "Strata levies",
                      strataLevies,
                      setStrataLevies
                    )}
                    {renderPropertyField(
                      "Water charges",
                      waterCharges,
                      setWaterCharges,
                      true,
                      "$840"
                    )}
                    {renderPropertyField(
                      "Repairs & maintenance",
                      repairsMaintenance,
                      setRepairsMaintenance,
                      true,
                      "$840"
                    )}
                  </div>
                  {/* Full-width Add Total $ (Figma 958:3976 width=1094) */}
                  <div>
                    {renderPropertyField(
                      "Add Total $",
                      operatingTotal,
                      setOperatingTotal
                    )}
                  </div>
                </div>

                {/* Section 3: Government & Statutory Charges (Figma 741:9480) */}
                <div className="bg-[#FBFBFC] border border-[#F0F1F3] rounded-[12px] p-5 space-y-4">
                  <div className="border-b border-[#E5E7EB] pb-2.5 w-[496px] max-w-full">
                    <h4 className="text-[14px] font-bold text-[#071E36]">
                      Government &amp; Statutory Charges
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {renderPropertyField(
                      "State land tax notices",
                      landTax,
                      setLandTax
                    )}
                    {renderPropertyField(
                      "Statutory municipal levies",
                      municipalLevies,
                      setMunicipalLevies,
                      true,
                      "$840"
                    )}
                    {renderPropertyField(
                      "Annual regulatory compliance inspection",
                      complianceInspection,
                      setComplianceInspection
                    )}
                  </div>
                  {/* Full-width Add Total $ (Figma 958:4069 width=1094) */}
                  <div>
                    {renderPropertyField("Add Total $", govTotal, setGovTotal)}
                  </div>
                </div>

                {/* Section 4: Finance Cost (Figma 741:9569) */}
                <div className="bg-[#FBFBFC] border border-[#F0F1F3] rounded-[12px] p-5 space-y-4">
                  <div className="border-b border-[#E5E7EB] pb-2.5 w-[496px] max-w-full">
                    <h4 className="text-[14px] font-bold text-[#071E36]">
                      Finance Cost
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {renderPropertyField(
                      "Bank mortgage interest",
                      mortgageInterest,
                      setMortgageInterest
                    )}
                    {renderPropertyField(
                      "Annual package fees",
                      annualPackageFees,
                      setAnnualPackageFees,
                      true,
                      "$840"
                    )}
                    {renderPropertyField(
                      "Ongoing debt service charges",
                      debtServiceCharges,
                      setDebtServiceCharges
                    )}
                    {renderPropertyField(
                      "Net Taxable Rental Income",
                      netTaxableRentalIncome,
                      setNetTaxableRentalIncome
                    )}
                    {renderPropertyField(
                      "Other expenses",
                      otherExpenses,
                      setOtherExpenses,
                      true,
                      "$840"
                    )}
                    {renderPropertyField(
                      "Net Rent (per tax Return)",
                      netRentTaxReturn,
                      setNetRentTaxReturn
                    )}
                  </div>
                  {/* Full-width Add Total $ (Figma 958:4160 width=1094) */}
                  <div>
                    {renderPropertyField(
                      "Add Total $",
                      financeTotal,
                      setFinanceTotal
                    )}
                  </div>
                  {/* Full-width Depreciation (Figma 958:4169 width=1094 height=69) */}
                  <div>
                    <label className="block text-[13.5px] font-normal text-[#1A1C1E] mb-2">
                      Depreciation
                    </label>
                    <input
                      type="text"
                      value={depreciation}
                      onChange={(e) => setDepreciation(e.target.value)}
                      placeholder="Depreciation....."
                      className="w-full h-[69px] px-3.5 bg-[#F7F8FA] border border-[#D8E0E8] rounded-[8px] text-[13.5px] text-[#8C9BA8] placeholder-[#9AA5B1] focus:text-[#1A1C1E] focus:bg-white focus:outline-none focus:border-[#0E2841] transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons matching Figma 633:10089 (Back on far left, Save & Completed on far right) */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setPropertyViewMode("list")}
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
                    onClick={() => handleSavePropertySnapshots(false)}
                    className="h-[40px] w-[80px] rounded-[8px] border border-[#071E36] bg-white text-[#071E36] hover:bg-gray-50 text-[13.5px] font-medium transition-colors cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSavePropertySnapshots(true)}
                    className="h-[40px] w-[123px] rounded-[8px] bg-[#071E36] hover:bg-[#122D4D] text-white text-[13.5px] font-medium transition-colors cursor-pointer shadow-xs"
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
                  <span className="text-[13px] text-[#8C9BA8] font-normal">
                    Facility ID: {selectedLoan.facilityId}
                  </span>
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
                    <div className="relative">
                      <input
                        type="text"
                        value={loanClosedDate}
                        onChange={(e) => setLoanClosedDate(e.target.value)}
                        placeholder="dd-mm-yyyy"
                        className="h-[44px] w-[156px] px-3.5 pr-9 bg-white border border-[#E2E8F0] rounded-[8px] text-[13px] text-[#1A1C1E] placeholder-[#1A1C1E] focus:outline-none focus:border-[#0E2841]"
                      />
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#1A1C1E] pointer-events-none" />
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
                            onChange={(e) => setLoanBalanceEofy(e.target.value)}
                            className="bg-transparent text-[13.5px] text-[#1A1C1E] w-[130px] focus:bg-[#F7F8FA] focus:px-2 py-1 rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#071E36] transition-all"
                          />
                        </td>
                        <td className="py-3 px-2">
                          <input
                            type="text"
                            value={loanBalanceReview}
                            onChange={(e) =>
                              setLoanBalanceReview(e.target.value)
                            }
                            className="bg-transparent text-[13.5px] text-[#1A1C1E] w-[130px] focus:bg-[#F7F8FA] focus:px-2 py-1 rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#071E36] transition-all"
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
                            onChange={(e) =>
                              setInterestRateEofy(e.target.value)
                            }
                            className="bg-transparent text-[13.5px] text-[#1A1C1E] w-[130px] focus:bg-[#F7F8FA] focus:px-2 py-1 rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#071E36] transition-all"
                          />
                        </td>
                        <td className="py-3 px-2">
                          <input
                            type="text"
                            value={interestRateReview}
                            onChange={(e) =>
                              setInterestRateReview(e.target.value)
                            }
                            className="bg-transparent text-[13.5px] text-[#1A1C1E] w-[130px] focus:bg-[#F7F8FA] focus:px-2 py-1 rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#071E36] transition-all"
                          />
                        </td>
                        <td className="py-3 px-2">
                          <input
                            type="text"
                            value={interestRateMarket}
                            onChange={(e) =>
                              setInterestRateMarket(e.target.value)
                            }
                            className="bg-transparent text-[13.5px] text-[#1A1C1E] w-[130px] focus:bg-[#F7F8FA] focus:px-2 py-1 rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#071E36] transition-all"
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
                            onChange={(e) => setOffsetEofy(e.target.value)}
                            className="bg-transparent text-[13.5px] text-[#1A1C1E] w-[130px] focus:bg-[#F7F8FA] focus:px-2 py-1 rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#071E36] transition-all"
                          />
                        </td>
                        <td className="py-3 px-2">
                          <input
                            type="text"
                            value={offsetReview}
                            onChange={(e) => setOffsetReview(e.target.value)}
                            className="bg-transparent text-[13.5px] text-[#1A1C1E] w-[130px] focus:bg-[#F7F8FA] focus:px-2 py-1 rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#071E36] transition-all"
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

          {/* Card 2: Market Data (Figma 991:9443) */}
          <div className="bg-white rounded-[16px] p-6 sm:p-8 shadow-[0px_2px_12px_rgba(0,0,0,0.03)] border border-[#EDEDF0] space-y-5">
            <div>
              <h3 className="text-[18px] font-bold text-[#071E36]">
                Market Data
              </h3>
              <p className="text-[12px] text-[#071E36] font-normal mt-0.5">
                Economic and market benchmark rates applied to advisory models
                for FY2026
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
                    <th className="py-2.5 px-3 font-semibold text-[13px] text-[#7E8B97]">
                      <div>22 Oak Avenue</div>
                      <div className="text-[12px] text-[#9AA5B1] font-normal">
                        16/06/2015
                      </div>
                    </th>
                    <th className="py-2.5 px-3 font-semibold text-[13px] text-[#7E8B97]">
                      <div>15 Sunview parade</div>
                      <div className="text-[12px] text-[#9AA5B1] font-normal">
                        16/06/2015
                      </div>
                    </th>
                    <th className="py-2.5 px-3 font-semibold text-[13px] text-[#7E8B97]">
                      <div>8 pacific Drive</div>
                      <div className="text-[12px] text-[#9AA5B1] font-normal">
                        16/06/2015
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="h-[52px]">
                    <td className="py-2.5 px-3 text-[13.5px] text-[#1A1C1E] whitespace-nowrap">
                      ASX 200 Accumulation Index
                    </td>
                    <td className="py-2.5 px-3 text-[13.5px] text-[#1A1C1E] whitespace-nowrap">
                      Total Property Return
                    </td>
                    <td className="py-2.5 px-3 text-[13.5px] text-[#1A1C1E]">
                      30/06/2026
                    </td>
                    <td className="py-2.5 px-3 text-[13.5px] text-[#1A1C1E]">
                      20,160
                    </td>
                    <td className="py-2.5 px-3 text-[13.5px] text-[#1A1C1E]">
                      20,160
                    </td>
                    <td className="py-2.5 px-3 text-[13.5px] text-[#1A1C1E]">
                      20,160
                    </td>
                  </tr>

                  <tr className="h-[52px]">
                    <td className="py-2.5 px-3 text-[13.5px] text-[#1A1C1E] whitespace-nowrap">
                      Unit / Apartment Yield
                    </td>
                    <td className="py-2.5 px-3 text-[13.5px] text-[#1A1C1E] whitespace-nowrap">
                      Gross Yield Units
                    </td>
                    <td className="py-2.5 px-3 text-[13.5px] text-[#1A1C1E]">
                      30/06/2026
                    </td>
                    <td className="py-2.5 px-3 text-[13.5px] text-[#1A1C1E]">
                      4.20%
                    </td>
                    <td className="py-2.5 px-3 text-[13.5px] text-[#1A1C1E]">
                      4.20%
                    </td>
                    <td className="py-2.5 px-3 text-[13.5px] text-[#1A1C1E]">
                      4.20%
                    </td>
                  </tr>

                  <tr className="h-[52px]">
                    <td className="py-2.5 px-3 text-[13.5px] text-[#1A1C1E] whitespace-nowrap">
                      House Yield
                    </td>
                    <td className="py-2.5 px-3 text-[13.5px] text-[#1A1C1E] whitespace-nowrap">
                      Gross Yield House
                    </td>
                    <td className="py-2.5 px-3 text-[13.5px] text-[#1A1C1E]">
                      30/06/2026
                    </td>
                    <td className="py-2.5 px-3 text-[13.5px] text-[#1A1C1E]">
                      3.80%
                    </td>
                    <td className="py-2.5 px-3 text-[13.5px] text-[#1A1C1E]">
                      3.80%
                    </td>
                    <td className="py-2.5 px-3 text-[13.5px] text-[#1A1C1E]">
                      3.80%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Button matching Figma Frame 741:10722 -> Opens Figma node 630:5992 UI */}
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => {
                setSelectedPropertyId("prop-1");
                setActiveTab("property-data");
                setPropertyViewMode("detail");
              }}
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
              currentValuation: parseNum(newP.currentValue, 1150000),
              weeklyRent: parseNum(newP.rentWeekly, 850),
              landSize: newP.landSize,
              beds: newP.beds,
              baths: newP.baths,
              cars: newP.cars,
              owner1: newP.owner1,
              owner1Pct: newP.owner1Pct,
              owner2: newP.owner2,
              owner2Pct: newP.owner2Pct,
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
