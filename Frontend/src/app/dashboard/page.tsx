"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import TopNav from "@/components/dashboard/TopNav";
import HouseholdCard from "@/components/dashboard/HouseholdCard";
import SearchCard from "@/components/dashboard/SearchCard";
import LoanMetrics from "@/components/dashboard/LoanMetrics";
import ReviewStatus from "@/components/dashboard/ReviewStatus";
import LoanListModal, {
  LoanCategory,
  LoanItem,
} from "@/components/dashboard/LoanListModal";
import { fetchDashboardSummary } from "@/lib/api";

const DEFAULT_LOANS: LoanItem[] = [
  {
    id: "loan-1",
    householdId: "harrison-household",
    householdName: "THE HARRISON FAMILY",
    propertyAddress: "48 Underwood Street, Paddington NSW 2021",
    lender: "ANZ",
    loanReference: "ANZ1477642",
    accountName: "ANZ1477642 — ANZ Banking Group (Investment)",
    isTchLoan: true,
    purpose: "Investment",
    repaymentType: "Interest only",
    rateType: "Variable",
    loanType: "IO",
    loanBalance: 650000,
    loanLimit: 700000,
    offsetBalance: 24000,
    interestRate: 0.0614,
    annualRepayments: 38436,
    ioExpiry: "24/10/2026",
    fixedExpiry: "----",
    maturityDate: "24/10/2026",
    settlementDate: "24/10/2026",
  },
  {
    id: "loan-2",
    householdId: "harrison-household",
    householdName: "THE HARRISON FAMILY",
    propertyAddress: "7 Kawana Way, Buddina QLD 4575",
    lender: "CBA",
    loanReference: "CBA124523",
    accountName: "CBA124523 — Commonwealth Bank (Investment)",
    isTchLoan: false,
    purpose: "Investment",
    repaymentType: "Principal & Interest",
    rateType: "Fixed",
    loanType: "P&I",
    loanBalance: 480000,
    loanLimit: 520000,
    offsetBalance: 15000,
    interestRate: 0.0585,
    annualRepayments: 32500,
    ioExpiry: "----",
    fixedExpiry: "24/10/2026",
    maturityDate: "24/10/2026",
    settlementDate: "24/10/2026",
  },
  {
    id: "loan-3",
    householdId: "harrison-household",
    householdName: "THE HARRISON FAMILY",
    propertyAddress: "22 Oak Avenue, Mooloolaba QLD 4557",
    lender: "NAB",
    loanReference: "NAB-4421-02",
    accountName: "NAB-4421-02 — National Australia Bank (Home Loan)",
    isTchLoan: false,
    purpose: "Home Loan",
    repaymentType: "Principal & Interest",
    rateType: "Fixed",
    loanType: "P&I",
    loanBalance: 720000,
    loanLimit: 750000,
    offsetBalance: 32000,
    interestRate: 0.0594,
    annualRepayments: 48600,
    ioExpiry: "----",
    fixedExpiry: "24/10/2026",
    maturityDate: "15/06/2047",
    settlementDate: "15/06/2026",
  },
  {
    id: "loan-4",
    householdId: "thompson-household",
    householdName: "THOMPSON FAMILY",
    propertyAddress: "12 Marine Parade, Manly NSW 2095",
    lender: "Macquarie",
    loanReference: "MAC-991204",
    accountName: "MAC-991204 — Macquarie Bank (Investment)",
    isTchLoan: true,
    purpose: "Investment",
    repaymentType: "Interest only",
    rateType: "Variable",
    loanType: "IO",
    loanBalance: 700000,
    loanLimit: 750000,
    offsetBalance: 35000,
    interestRate: 0.0594,
    annualRepayments: 41580,
    ioExpiry: "15/11/2026",
    fixedExpiry: "----",
    maturityDate: "15/11/2026",
    settlementDate: "15/11/2026",
  },
  {
    id: "loan-5",
    householdId: "kaiser-household",
    householdName: "KAISER BROWN",
    propertyAddress: "88 Queen Street, Melbourne VIC 3000",
    lender: "Westpac",
    loanReference: "WBC-552109",
    accountName: "WBC-552109 — Westpac Banking Corp (Investment)",
    isTchLoan: true,
    purpose: "Investment",
    repaymentType: "Interest only",
    rateType: "Variable",
    loanType: "IO",
    loanBalance: 600000,
    loanLimit: 650000,
    offsetBalance: 20000,
    interestRate: 0.0585,
    annualRepayments: 35100,
    ioExpiry: "10/12/2026",
    fixedExpiry: "----",
    maturityDate: "10/12/2026",
    settlementDate: "10/12/2026",
  },
];

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [selectedLoanCategory, setSelectedLoanCategory] =
    useState<LoanCategory>("total");

  useEffect(() => {
    fetchDashboardSummary()
      .then((data) => setSummary(data))
      .catch((err) => console.error("Failed to fetch dashboard summary:", err));
  }, []);

  const handleOpenLoanCategory = (category: LoanCategory) => {
    setSelectedLoanCategory(category);
    setIsLoanModalOpen(true);
  };

  const loansList: LoanItem[] =
    summary?.loans && summary.loans.length > 0 ? summary.loans : DEFAULT_LOANS;

  return (
    <div className="h-screen w-full bg-[#F8F9FB] flex overflow-hidden select-none">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
        />
      )}

      {/* Main Content Area - scrollable with sticky header */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto min-w-0">
        {/* Top Navigation Bar */}
        <TopNav onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {/* Dashboard Body */}
        <main className="flex-1 p-6 sm:p-8 max-w-[1240px] w-full">
          {/* Page Heading */}
          <div className="mb-6">
            <h1 className="font-['Familjen_Grotesk',sans-serif] font-semibold text-[#0E2841] text-[26px] tracking-[0.13px] leading-normal">
              Dashboard
            </h1>
          </div>

          {/* Top Row Cards: Household & Search */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <HouseholdCard totalHouseholds={summary?.totalHouseholds ?? 4} />
            <SearchCard />
          </div>

          {/* Main Grid: Loan Metrics (Left) & Review Status (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left Column: Loan Metrics (Clickable cards) */}
            <div className="lg:col-span-7 xl:col-span-7">
              <LoanMetrics
                metrics={summary?.loanMetrics}
                onSelectCategory={handleOpenLoanCategory}
              />
            </div>

            {/* Right Column: Review Status */}
            <div className="lg:col-span-5 xl:col-span-5">
              <ReviewStatus counts={summary?.reviewStatusCounts} />
            </div>
          </div>
        </main>
      </div>

      {/* Full Interactive Loan Facilities Modal */}
      <LoanListModal
        isOpen={isLoanModalOpen}
        onClose={() => setIsLoanModalOpen(false)}
        initialCategory={selectedLoanCategory}
        loans={loansList}
      />
    </div>
  );
}
