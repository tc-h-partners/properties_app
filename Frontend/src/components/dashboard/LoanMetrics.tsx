"use client";

import React from "react";
import Image from "next/image";
import { ArrowUpRight, CalendarDays } from "lucide-react";
import { LoanCategory } from "./LoanListModal";

interface LoanMetricsProps {
  metrics?: {
    totalLoan: number;
    tchLoans: number;
    tchPortfolioPct: number;
    nonTchLoans: number;
    nonTchPortfolioPct: number;
    fixedExpiryAmount: number;
    fixedExpiryLender: string;
    ioExpiryAmount: number;
    ioExpiryCount: number;
    settlementDateAmount?: number;
    settlementDateCount?: number;
    settlementDateNearest?: string;
  };
  onSelectCategory?: (category: LoanCategory) => void;
}

function formatCurrency(val?: number) {
  const num = Number(val || 0);
  return `$${num.toLocaleString("en-AU", { maximumFractionDigits: 0 })}`;
}

export default function LoanMetrics({
  metrics,
  onSelectCategory,
}: LoanMetricsProps) {
  const totalLoan = metrics?.totalLoan ?? 3150000;
  const tchLoans = metrics?.tchLoans ?? 1950000;
  const tchPct = metrics?.tchPortfolioPct ?? 61.9;
  const nonTchLoans = metrics?.nonTchLoans ?? 1200000;
  const nonTchPct = metrics?.nonTchPortfolioPct ?? 38.1;
  const fixedExpiryAmount = metrics?.fixedExpiryAmount ?? 1200000;
  const fixedExpiryLender = metrics?.fixedExpiryLender || "CBA";
  const ioExpiryAmount = metrics?.ioExpiryAmount ?? 1950000;
  const ioExpiryCount = metrics?.ioExpiryCount ?? 3;
  const settlementDateAmount = metrics?.settlementDateAmount ?? totalLoan;
  const settlementDateCount = metrics?.settlementDateCount ?? 5;
  const settlementDateNearest = metrics?.settlementDateNearest || "24/10/2026";

  return (
    <div className="bg-white rounded-[12px] p-6 shadow-[0px_11px_9px_rgba(0,0,0,0.04)] select-none">
      {/* Title & Clickable Hint */}
      <div className="flex items-center justify-between">
        <h2 className="font-['Poppins',sans-serif] font-semibold text-[#0E2841] text-[20px] tracking-[-0.64px]">
          Loan Metrics
        </h2>
      </div>

      {/* Top Divider */}
      <div className="h-[1px] w-full bg-[#E2E8F0] my-4" />

      {/* Row 1: Total Loan & TC&H Loans */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Card 1: Total Loan */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSelectCategory?.("total")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelectCategory?.("total");
            }
          }}
          className="relative bg-[#F6F9FB] hover:bg-[#EEF4F8] hover:shadow-[0px_4px_14px_rgba(14,40,65,0.08)] rounded-[12px] p-4 sm:px-5 flex items-center gap-[18px] transition-all duration-150 cursor-pointer group border border-transparent hover:border-[#CBD5E1] active:scale-[0.99]"
          title="Click to view all loan facilities"
        >
          <div className="bg-white border border-[#DCE4E8] shadow-[0px_4px_2px_rgba(0,0,0,0.05)] rounded-full size-[50px] flex items-center justify-center p-[5px] shrink-0 group-hover:border-[#0E2841]/30 transition-colors">
            <Image
              src="/images/dashboard/loan.svg"
              alt=""
              width={24}
              height={24}
              className="size-[24px] object-contain"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="font-['Poppins',sans-serif] font-medium text-[#8B8585] group-hover:text-[#0E2841] text-[15px] sm:text-[16px] leading-tight transition-colors">
                Total Loan
              </p>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#94A3B8] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="font-['Poppins',sans-serif] font-extrabold text-[#8B8585] group-hover:text-[#0E2841] text-[14px] mt-1.5 leading-none transition-colors">
              {formatCurrency(totalLoan)}
            </p>
            <div className="h-[1px] w-[94px] bg-[#CBD5E1] my-2" />
            <p className="font-['Poppins',sans-serif] font-normal text-[#8B8585] text-[13px] sm:text-[14px] leading-none">
              100% of Debt
            </p>
          </div>
        </div>

        {/* Card 2: TC&H Loans */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSelectCategory?.("tch")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelectCategory?.("tch");
            }
          }}
          className="relative bg-[#F6F9FB] hover:bg-[#EEF4F8] hover:shadow-[0px_4px_14px_rgba(14,40,65,0.08)] rounded-[12px] p-4 sm:px-5 flex items-center gap-[18px] transition-all duration-150 cursor-pointer group border border-transparent hover:border-[#CBD5E1] active:scale-[0.99]"
          title="Click to view TC&H loan facilities"
        >
          <div className="bg-white border border-[#DCE4E8] shadow-[0px_4px_2px_rgba(0,0,0,0.05)] rounded-full size-[50px] flex items-center justify-center p-[5px] shrink-0 group-hover:border-[#0E2841]/30 transition-colors">
            <Image
              src="/images/dashboard/loan.svg"
              alt=""
              width={24}
              height={24}
              className="size-[24px] object-contain"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="font-['Poppins',sans-serif] font-medium text-[#8B8585] group-hover:text-[#0E2841] text-[15px] sm:text-[16px] leading-tight transition-colors">
                TC&amp;H Loans
              </p>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#94A3B8] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="font-['Poppins',sans-serif] font-extrabold text-[#8B8585] group-hover:text-[#0E2841] text-[14px] mt-1.5 leading-none transition-colors">
              {formatCurrency(tchLoans)}
            </p>
            <div className="h-[1px] w-[94px] bg-[#CBD5E1] my-2" />
            <p className="font-['Poppins',sans-serif] font-normal text-[#8B8585] text-[13px] sm:text-[14px] leading-none">
              {tchPct}% Portfolio
            </p>
          </div>
        </div>
      </div>

      {/* Row 2: Household Loans (Not TC&H) & Loans Settlement Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-3.5">
        {/* Card 3: Household Loans (Not TC&H) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSelectCategory?.("non-tch")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelectCategory?.("non-tch");
            }
          }}
          className="relative bg-[#F6F9FB] hover:bg-[#EEF4F8] hover:shadow-[0px_4px_14px_rgba(14,40,65,0.08)] rounded-[12px] p-4 sm:px-5 flex items-center gap-[18px] transition-all duration-150 cursor-pointer group border border-transparent hover:border-[#CBD5E1] active:scale-[0.99]"
          title="Click to view external non-TC&H household loans"
        >
          <div className="bg-white border border-[#DCE4E8] shadow-[0px_4px_2px_rgba(0,0,0,0.05)] rounded-full size-[50px] flex items-center justify-center p-[5px] shrink-0 group-hover:border-[#0E2841]/30 transition-colors">
            <Image
              src="/images/dashboard/mortgage.svg"
              alt=""
              width={24}
              height={24}
              className="size-[24px] object-contain"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="font-['Poppins',sans-serif] font-medium text-[#8B8585] group-hover:text-[#0E2841] text-[15px] sm:text-[16px] leading-tight transition-colors">
                Household Loans(Not TC&amp;H)
              </p>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#94A3B8] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="font-['Poppins',sans-serif] font-extrabold text-[#8B8585] group-hover:text-[#0E2841] text-[14px] mt-1.5 leading-none transition-colors">
              {formatCurrency(nonTchLoans)}
            </p>
            <div className="h-[1px] w-[94px] bg-[#CBD5E1] my-2" />
            <p className="font-['Poppins',sans-serif] font-normal text-[#8B8585] text-[13px] sm:text-[14px] leading-none">
              {nonTchPct}% Portfolio
            </p>
          </div>
        </div>

        {/* Card 4: Loans Settlement Date */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSelectCategory?.("settlement")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelectCategory?.("settlement");
            }
          }}
          className="relative bg-[#F6F9FB] hover:bg-[#EEF4F8] hover:shadow-[0px_4px_14px_rgba(14,40,65,0.08)] rounded-[12px] p-4 sm:px-5 flex items-center gap-[18px] transition-all duration-150 cursor-pointer group border border-transparent hover:border-[#CBD5E1] active:scale-[0.99]"
          title="Click to view loans by settlement & maturity dates"
        >
          <div className="bg-white border border-[#DCE4E8] shadow-[0px_4px_2px_rgba(0,0,0,0.05)] rounded-full size-[50px] flex items-center justify-center p-[5px] shrink-0 group-hover:border-[#0E2841]/30 transition-colors">
            <CalendarDays className="size-[22px] text-[#0E2841]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="font-['Poppins',sans-serif] font-medium text-[#8B8585] group-hover:text-[#0E2841] text-[15px] sm:text-[16px] leading-tight transition-colors">
                Loans Settlement Date
              </p>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#94A3B8] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="font-['Poppins',sans-serif] font-extrabold text-[#8B8585] group-hover:text-[#0E2841] text-[14px] mt-1.5 leading-none transition-colors">
              {formatCurrency(settlementDateAmount)}
            </p>
            <div className="h-[1px] w-[94px] bg-[#CBD5E1] my-2" />
            <p className="font-['Poppins',sans-serif] font-normal text-[#8B8585] text-[13px] sm:text-[14px] leading-none truncate">
              {settlementDateCount} in portfolio · {settlementDateNearest}
            </p>
          </div>
        </div>
      </div>

      {/* Middle Divider */}
      <div className="h-[1px] w-full bg-[#E2E8F0] my-4" />

      {/* Row 3: Fixed Rate Expiry & IO Expiry */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Card 5: Fixed Rate Expiry */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSelectCategory?.("fixed-expiry")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelectCategory?.("fixed-expiry");
            }
          }}
          className="relative bg-[#F6F9FB] hover:bg-[#EEF4F8] hover:shadow-[0px_4px_14px_rgba(14,40,65,0.08)] rounded-[12px] p-4 sm:px-5 flex items-center gap-[18px] transition-all duration-150 cursor-pointer group border border-transparent hover:border-[#CBD5E1] active:scale-[0.99]"
          title="Click to view loans with fixed rate expiring in 6 months"
        >
          <div className="bg-white border border-[#DCE4E8] shadow-[0px_4px_2px_rgba(0,0,0,0.05)] rounded-full size-[50px] flex items-center justify-center p-[5px] shrink-0 group-hover:border-[#0E2841]/30 transition-colors">
            <Image
              src="/images/dashboard/timer.svg"
              alt=""
              width={24}
              height={24}
              className="size-[24px] object-contain"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="font-['Poppins',sans-serif] font-medium text-[#8B8585] group-hover:text-[#0E2841] text-[15px] sm:text-[16px] leading-tight transition-colors">
                Fixed Rate Expiry (6 months)
              </p>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#94A3B8] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="font-['Poppins',sans-serif] font-extrabold text-[#8B8585] group-hover:text-[#0E2841] text-[14px] mt-1.5 leading-none transition-colors">
              {formatCurrency(fixedExpiryAmount)}
            </p>
            <div className="h-[1px] w-[177px] max-w-full bg-[#CBD5E1] my-2" />
            <p className="font-['Poppins',sans-serif] font-normal text-[#8B8585] text-[13px] sm:text-[14px] leading-none">
              {fixedExpiryLender}
            </p>
          </div>
        </div>

        {/* Card 6: IO Expiry */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSelectCategory?.("io-expiry")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelectCategory?.("io-expiry");
            }
          }}
          className="relative bg-[#F6F9FB] hover:bg-[#EEF4F8] hover:shadow-[0px_4px_14px_rgba(14,40,65,0.08)] rounded-[12px] p-4 sm:px-5 flex items-center gap-[18px] transition-all duration-150 cursor-pointer group border border-transparent hover:border-[#CBD5E1] active:scale-[0.99]"
          title="Click to view loans with interest-only expiring in 6 months"
        >
          <div className="bg-white border border-[#DCE4E8] shadow-[0px_4px_2px_rgba(0,0,0,0.05)] rounded-full size-[50px] flex items-center justify-center p-[5px] shrink-0 group-hover:border-[#0E2841]/30 transition-colors">
            <Image
              src="/images/dashboard/gauge.svg"
              alt=""
              width={24}
              height={24}
              className="size-[24px] object-contain"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="font-['Poppins',sans-serif] font-medium text-[#8B8585] group-hover:text-[#0E2841] text-[15px] sm:text-[16px] leading-tight transition-colors">
                IO Expiry (6 months)
              </p>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#94A3B8] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="font-['Poppins',sans-serif] font-extrabold text-[#8B8585] group-hover:text-[#0E2841] text-[14px] mt-1.5 leading-none transition-colors">
              {formatCurrency(ioExpiryAmount)}
            </p>
            <div className="h-[1px] w-[94px] bg-[#CBD5E1] my-2" />
            <p className="font-['Poppins',sans-serif] font-normal text-[#8B8585] text-[13px] sm:text-[14px] leading-none">
              {ioExpiryCount} in immediate 6-mo window ·
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
