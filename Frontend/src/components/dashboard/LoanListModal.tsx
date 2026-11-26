"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  X,
  Search,
  ExternalLink,
  Building2,
  Calendar,
  Coins,
  ShieldCheck,
  Percent,
  Clock,
  ArrowUpDown,
  Filter,
} from "lucide-react";

export type LoanCategory =
  | "total"
  | "tch"
  | "non-tch"
  | "settlement"
  | "fixed-expiry"
  | "io-expiry";

export interface LoanItem {
  id: string;
  householdId: string;
  householdName: string;
  propertyId?: string;
  propertyName?: string;
  propertyAddress: string;
  lender: string;
  loanReference: string;
  accountName?: string;
  isTchLoan: boolean;
  purpose: string;
  repaymentType: string;
  rateType: string;
  loanType: string;
  loanBalance: number;
  offsetBalance?: number;
  interestRate: number;
  loanLimit?: number;
  annualRepayments?: number;
  ioExpiry?: string;
  fixedExpiry?: string;
  maturityDate?: string;
  settlementDate?: string;
  security1?: string;
  security2?: string;
  security3?: string;
}

interface LoanListModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: LoanCategory;
  loans?: LoanItem[];
}

function formatCurrency(val?: number) {
  const num = Number(val || 0);
  return `$${num.toLocaleString("en-AU", { maximumFractionDigits: 0 })}`;
}

function formatPercent(val?: number) {
  const num = Number(val || 0);
  // If decimal e.g. 0.0594, display 5.94%
  const pct = num < 1 && num > 0 ? num * 100 : num;
  return `${pct.toFixed(2)}%`;
}

const CATEGORY_CONFIG: Record<
  LoanCategory,
  {
    title: string;
    badge: string;
    description: string;
  }
> = {
  total: {
    title: "Total Loans",
    badge: "All Facilities",
    description:
      "All active loan facilities across client households and managed properties.",
  },
  tch: {
    title: "TC&H Loans",
    badge: "TC&H Managed",
    description:
      "Loan facilities actively managed, structured, or advised through TC&H.",
  },
  "non-tch": {
    title: "Household Loans (Not TC&H)",
    badge: "Non-TC&H Facilities",
    description:
      "External residential and private investment loans outside the TC&H advisory perimeter.",
  },
  settlement: {
    title: "Loans Settlement Date",
    badge: "Settlement & Maturity",
    description:
      "Facilities tracked by property settlement, facility drawdown, or term maturity date.",
  },
  "fixed-expiry": {
    title: "Fixed Rate Expiry (6 months)",
    badge: "Fixed Rollover Window",
    description:
      "Fixed rate loan facilities reaching expiration within the next 6 months.",
  },
  "io-expiry": {
    title: "IO Expiry (6 months)",
    badge: "Interest-Only Expiry",
    description:
      "Interest-only facilities approaching rollover into principal & interest.",
  },
};

export default function LoanListModal({
  isOpen,
  onClose,
  initialCategory = "total",
  loans = [],
}: LoanListModalProps) {
  const [activeCategory, setActiveCategory] =
    useState<LoanCategory>(initialCategory);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLender, setSelectedLender] = useState<string>("ALL");
  const [sortField, setSortField] = useState<"balance" | "lender" | "rate">(
    "balance"
  );
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    if (initialCategory) {
      setActiveCategory(initialCategory);
    }
  }, [initialCategory]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Distinct Lenders
  const lenders = useMemo(() => {
    const set = new Set<string>();
    loans.forEach((l) => {
      if (l.lender) set.add(l.lender);
    });
    return Array.from(set).sort();
  }, [loans]);

  // Category counts
  const categoryCounts = useMemo(() => {
    return {
      total: loans.length,
      tch: loans.filter((l) => l.isTchLoan).length,
      "non-tch": loans.filter((l) => !l.isTchLoan).length,
      settlement: loans.filter(
        (l) =>
          (l.settlementDate && l.settlementDate !== "----") ||
          (l.maturityDate && l.maturityDate !== "----")
      ).length,
      "fixed-expiry": loans.filter(
        (l) =>
          l.fixedExpiry &&
          l.fixedExpiry !== "----" &&
          l.fixedExpiry !== "N/A" &&
          l.fixedExpiry !== "-"
      ).length,
      "io-expiry": loans.filter(
        (l) =>
          l.ioExpiry &&
          l.ioExpiry !== "----" &&
          l.ioExpiry !== "N/A" &&
          l.ioExpiry !== "-"
      ).length,
    };
  }, [loans]);

  // Filtered Loans
  const filteredLoans = useMemo(() => {
    let result = loans.filter((l) => {
      switch (activeCategory) {
        case "tch":
          return l.isTchLoan === true;
        case "non-tch":
          return l.isTchLoan === false;
        case "settlement":
          return (
            (l.settlementDate && l.settlementDate !== "----") ||
            (l.maturityDate && l.maturityDate !== "----")
          );
        case "fixed-expiry":
          return (
            l.fixedExpiry &&
            l.fixedExpiry !== "----" &&
            l.fixedExpiry !== "N/A" &&
            l.fixedExpiry !== "-"
          );
        case "io-expiry":
          return (
            l.ioExpiry &&
            l.ioExpiry !== "----" &&
            l.ioExpiry !== "N/A" &&
            l.ioExpiry !== "-"
          );
        case "total":
        default:
          return true;
      }
    });

    if (selectedLender !== "ALL") {
      result = result.filter(
        (l) => l.lender.toLowerCase() === selectedLender.toLowerCase()
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (l) =>
          l.householdName?.toLowerCase().includes(q) ||
          l.lender?.toLowerCase().includes(q) ||
          l.loanReference?.toLowerCase().includes(q) ||
          l.accountName?.toLowerCase().includes(q) ||
          l.propertyAddress?.toLowerCase().includes(q) ||
          l.purpose?.toLowerCase().includes(q) ||
          l.rateType?.toLowerCase().includes(q) ||
          l.loanType?.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      if (sortField === "balance") {
        return sortAsc
          ? a.loanBalance - b.loanBalance
          : b.loanBalance - a.loanBalance;
      }
      if (sortField === "rate") {
        return sortAsc
          ? a.interestRate - b.interestRate
          : b.interestRate - a.interestRate;
      }
      if (sortField === "lender") {
        return sortAsc
          ? a.lender.localeCompare(b.lender)
          : b.lender.localeCompare(a.lender);
      }
      return 0;
    });

    return result;
  }, [
    loans,
    activeCategory,
    selectedLender,
    searchQuery,
    sortField,
    sortAsc,
  ]);

  // Aggregate stats for filtered
  const stats = useMemo(() => {
    const totalBal = filteredLoans.reduce((sum, l) => sum + (l.loanBalance || 0), 0);
    const totalRepay = filteredLoans.reduce(
      (sum, l) => sum + (l.annualRepayments || 0),
      0
    );
    const avgRate =
      filteredLoans.length > 0
        ? filteredLoans.reduce((sum, l) => sum + (l.interestRate || 0), 0) /
          filteredLoans.length
        : 0;
    return {
      totalBal,
      totalRepay,
      avgRate,
      count: filteredLoans.length,
    };
  }, [filteredLoans]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-[1180px] max-h-[92vh] flex flex-col bg-white rounded-[20px] shadow-2xl border border-[#E2E8F0] overflow-hidden">
        {/* Navy Circular Close Button (matching Figma design system) */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 z-20 w-8 h-8 rounded-full bg-[#183654] text-white flex items-center justify-center hover:bg-[#0E2841] transition-all hover:scale-105 cursor-pointer shadow-md"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Modal Header */}
        <div className="px-6 sm:px-8 pt-7 pb-5 bg-gradient-to-b from-[#F8FAFC] to-white border-b border-[#E2E8F0]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-10">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold bg-[#0E2841]/10 text-[#0E2841]">
                  <Coins className="w-3.5 h-3.5" />
                  {CATEGORY_CONFIG[activeCategory].badge}
                </span>
                <span className="text-[13px] text-[#64748B] font-medium">
                  {stats.count} {stats.count === 1 ? "facility" : "facilities"} found
                </span>
              </div>
              <h2 className="text-[22px] sm:text-[24px] font-bold text-[#0E2841] tracking-tight font-['Poppins',sans-serif] mt-1">
                {CATEGORY_CONFIG[activeCategory].title}
              </h2>
              <p className="text-[13.5px] text-[#64748B] mt-0.5 max-w-[680px]">
                {CATEGORY_CONFIG[activeCategory].description}
              </p>
            </div>

            {/* Quick Aggregate Stats Strip */}
            <div className="flex items-center gap-3 shrink-0 bg-[#F1F5F9] px-4 py-2.5 rounded-[12px] border border-[#E2E8F0]">
              <div>
                <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                  Total Balance
                </p>
                <p className="text-[17px] font-extrabold text-[#0E2841] leading-tight">
                  {formatCurrency(stats.totalBal)}
                </p>
              </div>
              <div className="h-8 w-[1px] bg-[#CBD5E1]" />
              <div>
                <p className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                  Avg Rate
                </p>
                <p className="text-[15px] font-bold text-[#0E2841] leading-tight">
                  {formatPercent(stats.avgRate)}
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pt-5 pb-1 scrollbar-none">
            {(
              [
                { key: "total", label: "All Loans" },
                { key: "tch", label: "TC&H Loans" },
                { key: "non-tch", label: "Household (Not TC&H)" },
                { key: "settlement", label: "Settlement Date" },
                { key: "fixed-expiry", label: "Fixed Expiry (6mo)" },
                { key: "io-expiry", label: "IO Expiry (6mo)" },
              ] as const
            ).map((tab) => {
              const isActive = activeCategory === tab.key;
              const count = categoryCounts[tab.key];
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveCategory(tab.key)}
                  className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? "bg-[#0E2841] text-white shadow-sm font-semibold"
                      : "bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#0E2841]"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`inline-flex items-center justify-center text-[11px] font-bold rounded-full size-5 ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-white text-[#64748B] border border-[#CBD5E1]"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Secondary Filter Toolbar */}
        <div className="px-6 sm:px-8 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px] max-w-[420px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search lender, reference, household, suburb..."
              className="w-full h-[38px] pl-9 pr-3 text-[13px] bg-white border border-[#CBD5E1] rounded-[8px] focus:outline-none focus:border-[#0E2841] text-[#0E2841] placeholder-[#94A3B8]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0E2841] text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Lenders Filter & Sort Controls */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 text-[12px] text-[#64748B] font-medium">
              <Filter className="w-3.5 h-3.5" />
              <span>Lender:</span>
              <select
                value={selectedLender}
                onChange={(e) => setSelectedLender(e.target.value)}
                className="h-[34px] px-2.5 bg-white border border-[#CBD5E1] rounded-[8px] text-[12.5px] text-[#0E2841] font-medium focus:outline-none focus:border-[#0E2841]"
              >
                <option value="ALL">All Lenders</option>
                {lenders.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-[12px] text-[#64748B] font-medium">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Sort:</span>
              <button
                type="button"
                onClick={() => {
                  if (sortField === "balance") setSortAsc(!sortAsc);
                  else {
                    setSortField("balance");
                    setSortAsc(false);
                  }
                }}
                className={`px-2.5 py-1 rounded-[6px] text-[12px] font-medium cursor-pointer ${
                  sortField === "balance"
                    ? "bg-[#0E2841] text-white"
                    : "bg-white border border-[#CBD5E1] text-[#64748B]"
                }`}
              >
                Balance {sortField === "balance" && (sortAsc ? "↑" : "↓")}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (sortField === "rate") setSortAsc(!sortAsc);
                  else {
                    setSortField("rate");
                    setSortAsc(false);
                  }
                }}
                className={`px-2.5 py-1 rounded-[6px] text-[12px] font-medium cursor-pointer ${
                  sortField === "rate"
                    ? "bg-[#0E2841] text-white"
                    : "bg-white border border-[#CBD5E1] text-[#64748B]"
                }`}
              >
                Rate {sortField === "rate" && (sortAsc ? "↑" : "↓")}
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Table Content Area */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-4">
          {filteredLoans.length === 0 ? (
            <div className="py-16 text-center">
              <div className="size-14 rounded-full bg-[#F1F5F9] text-[#64748B] flex items-center justify-center mx-auto mb-3">
                <Coins className="w-7 h-7" />
              </div>
              <h3 className="text-[16px] font-bold text-[#0E2841]">
                No Loan Facilities Found
              </h3>
              <p className="text-[13px] text-[#64748B] mt-1 max-w-[420px] mx-auto">
                No facilities matching &quot;{CATEGORY_CONFIG[activeCategory].title}&quot;
                {searchQuery ? ` and search "${searchQuery}"` : ""}.
              </p>
              {(searchQuery || selectedLender !== "ALL") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedLender("ALL");
                  }}
                  className="mt-3 text-[13px] text-[#0E2841] font-semibold underline cursor-pointer"
                >
                  Reset search filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-[12px] border border-[#EDEDF0]">
              <table className="w-full text-left border-collapse min-w-[980px]">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#EDEDF0] text-[12px] font-semibold text-[#64748B] uppercase tracking-wider">
                    <th className="py-3 px-4">Client Household</th>
                    <th className="py-3 px-4">Lender &amp; Reference</th>
                    <th className="py-3 px-4">Structure</th>
                    <th className="py-3 px-4 text-right">Balance / Limit</th>
                    <th className="py-3 px-4 text-right">Rate &amp; Repayments</th>
                    <th className="py-3 px-4">Key Dates</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] text-[13.5px]">
                  {filteredLoans.map((l) => (
                    <tr
                      key={l.id}
                      className="hover:bg-[#F8FAFC] transition-colors group"
                    >
                      {/* Client Household & Property */}
                      <td className="py-3.5 px-4 max-w-[240px]">
                        <p className="font-bold text-[#0E2841] leading-snug">
                          {l.householdName}
                        </p>
                        <p className="text-[12.5px] text-[#64748B] mt-0.5 truncate flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                          <span className="truncate">{l.propertyAddress}</span>
                        </p>
                      </td>

                      {/* Lender & Reference */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-[6px] text-[12px] font-bold bg-[#E2E8F0] text-[#0E2841]">
                            {l.lender}
                          </span>
                          <span className="font-mono text-[13px] text-[#1E293B] font-semibold">
                            {l.loanReference}
                          </span>
                        </div>
                        {l.accountName && l.accountName !== l.loanReference && (
                          <p className="text-[11.5px] text-[#64748B] mt-1 max-w-[200px] truncate">
                            {l.accountName}
                          </p>
                        )}
                      </td>

                      {/* Loan Structure & TC&H */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {l.isTchLoan ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[11px] font-bold bg-[#DCFCE7] text-[#166534]">
                              <ShieldCheck className="w-3 h-3" />
                              TC&amp;H
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-[4px] text-[11px] font-medium bg-[#F1F5F9] text-[#64748B]">
                              Non-TC&amp;H
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-[4px] text-[11px] font-semibold bg-[#E0F2FE] text-[#0369A1]">
                            {l.loanType}
                          </span>
                          <span className="px-2 py-0.5 rounded-[4px] text-[11px] font-medium bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0]">
                            {l.rateType}
                          </span>
                        </div>
                        <p className="text-[11.5px] text-[#64748B] mt-1">
                          {l.purpose} • {l.repaymentType}
                        </p>
                      </td>

                      {/* Balance & Limit */}
                      <td className="py-3.5 px-4 text-right">
                        <p className="font-extrabold text-[#0E2841] text-[14.5px]">
                          {formatCurrency(l.loanBalance)}
                        </p>
                        {l.loanLimit ? (
                          <p className="text-[11.5px] text-[#64748B] mt-0.5">
                            Limit: {formatCurrency(l.loanLimit)}
                          </p>
                        ) : null}
                        {l.offsetBalance ? (
                          <p className="text-[11px] text-[#10B981] font-medium">
                            Offset: {formatCurrency(l.offsetBalance)}
                          </p>
                        ) : null}
                      </td>

                      {/* Rate & Repayments */}
                      <td className="py-3.5 px-4 text-right">
                        <p className="font-bold text-[#0E2841]">
                          {formatPercent(l.interestRate)}
                        </p>
                        {l.annualRepayments ? (
                          <p className="text-[11.5px] text-[#64748B] mt-0.5">
                            {formatCurrency(l.annualRepayments)} / yr
                          </p>
                        ) : null}
                      </td>

                      {/* Key Dates */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5 text-[12px]">
                          {activeCategory === "fixed-expiry" && (
                            <p className="text-[#DC2626] font-semibold flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Fixed Expiry: {l.fixedExpiry}
                            </p>
                          )}
                          {activeCategory === "io-expiry" && (
                            <p className="text-[#D97706] font-semibold flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              IO Expiry: {l.ioExpiry}
                            </p>
                          )}
                          {activeCategory === "settlement" && (
                            <p className="text-[#0E2841] font-semibold flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-[#0E2841]" />
                              Settlement: {l.settlementDate || l.maturityDate}
                            </p>
                          )}
                          {activeCategory !== "fixed-expiry" &&
                            activeCategory !== "io-expiry" &&
                            activeCategory !== "settlement" && (
                              <>
                                <p className="text-[#475569]">
                                  Settlement:{" "}
                                  <span className="font-medium">
                                    {l.settlementDate || l.maturityDate || "----"}
                                  </span>
                                </p>
                                {l.ioExpiry && l.ioExpiry !== "----" && (
                                  <p className="text-[#64748B]">
                                    IO: {l.ioExpiry}
                                  </p>
                                )}
                                {l.fixedExpiry && l.fixedExpiry !== "----" && (
                                  <p className="text-[#64748B]">
                                    Fixed: {l.fixedExpiry}
                                  </p>
                                )}
                              </>
                            )}
                        </div>
                      </td>

                      {/* Action to Household */}
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/household/${l.householdId}?tab=properties-loans`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[8px] bg-[#0E2841] hover:bg-[#183654] text-white text-[12px] font-medium transition-colors cursor-pointer shadow-xs"
                          title="Open household loans workspace"
                        >
                          <span>View</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 sm:px-8 py-3.5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between">
          <p className="text-[12.5px] text-[#64748B]">
            Showing <strong className="text-[#0E2841]">{filteredLoans.length}</strong> of{" "}
            <strong>{loans.length}</strong> total facilities across all households.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-[8px] bg-[#E2E8F0] hover:bg-[#CBD5E1] text-[#0E2841] text-[13px] font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
