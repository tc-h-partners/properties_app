"use client";

import React from "react";
import Image from "next/image";

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
  };
}

function formatCurrency(val?: number) {
  const num = Number(val || 0);
  return `$${num.toLocaleString("en-AU", { maximumFractionDigits: 0 })}`;
}

export default function LoanMetrics({ metrics }: LoanMetricsProps) {
  const totalLoan = metrics?.totalLoan ?? 0;
  const tchLoans = metrics?.tchLoans ?? 0;
  const tchPct = metrics?.tchPortfolioPct ?? 0;
  const nonTchLoans = metrics?.nonTchLoans ?? 0;
  const nonTchPct = metrics?.nonTchPortfolioPct ?? 0;
  const fixedExpiryAmount = metrics?.fixedExpiryAmount ?? 0;
  const fixedExpiryLender = metrics?.fixedExpiryLender || "None in window";
  const ioExpiryAmount = metrics?.ioExpiryAmount ?? 0;
  const ioExpiryCount = metrics?.ioExpiryCount ?? 0;

  return (
    <div className="bg-white rounded-[12px] p-6 shadow-[0px_11px_9px_rgba(0,0,0,0.04)] select-none">
      {/* Title */}
      <h2 className="font-['Poppins',sans-serif] font-semibold text-[#0E2841] text-[20px] tracking-[-0.64px]">
        Loan Metrics
      </h2>

      {/* Top Divider */}
      <div className="h-[1px] w-full bg-[#E2E8F0] my-4" />

      {/* Row 1: Total Loan & TC&H Loans */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Card 1: Total Loan */}
        <div className="bg-[#F6F9FB] rounded-[12px] p-4 sm:px-5 flex items-center gap-[18px]">
          <div className="bg-white border border-[#DCE4E8] shadow-[0px_4px_2px_rgba(0,0,0,0.05)] rounded-full size-[50px] flex items-center justify-center p-[5px] shrink-0">
            <Image
              src="/images/dashboard/loan.svg"
              alt=""
              width={24}
              height={24}
              className="size-[24px] object-contain"
            />
          </div>
          <div className="min-w-0">
            <p className="font-['Poppins',sans-serif] font-medium text-[#8B8585] text-[15px] sm:text-[16px] leading-tight">
              Total Loan
            </p>
            <p className="font-['Poppins',sans-serif] font-extrabold text-[#8B8585] text-[14px] mt-1.5 leading-none">
              {formatCurrency(totalLoan)}
            </p>
            <div className="h-[1px] w-[94px] bg-[#CBD5E1] my-2" />
            <p className="font-['Poppins',sans-serif] font-normal text-[#8B8585] text-[13px] sm:text-[14px] leading-none">
              100% of Debt
            </p>
          </div>
        </div>

        {/* Card 2: TC&H Loans */}
        <div className="bg-[#F6F9FB] rounded-[12px] p-4 sm:px-5 flex items-center gap-[18px]">
          <div className="bg-white border border-[#DCE4E8] shadow-[0px_4px_2px_rgba(0,0,0,0.05)] rounded-full size-[50px] flex items-center justify-center p-[5px] shrink-0">
            <Image
              src="/images/dashboard/loan.svg"
              alt=""
              width={24}
              height={24}
              className="size-[24px] object-contain"
            />
          </div>
          <div className="min-w-0">
            <p className="font-['Poppins',sans-serif] font-medium text-[#8B8585] text-[15px] sm:text-[16px] leading-tight">
              TC&amp;H Loans
            </p>
            <p className="font-['Poppins',sans-serif] font-extrabold text-[#8B8585] text-[14px] mt-1.5 leading-none">
              {formatCurrency(tchLoans)}
            </p>
            <div className="h-[1px] w-[94px] bg-[#CBD5E1] my-2" />
            <p className="font-['Poppins',sans-serif] font-normal text-[#8B8585] text-[13px] sm:text-[14px] leading-none">
              {tchPct}% Portfolio
            </p>
          </div>
        </div>
      </div>

      {/* Row 2: Household Loans (Not TC&H) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-3.5">
        <div className="bg-[#F6F9FB] rounded-[12px] p-4 sm:px-5 flex items-center gap-[18px]">
          <div className="bg-white border border-[#DCE4E8] shadow-[0px_4px_2px_rgba(0,0,0,0.05)] rounded-full size-[50px] flex items-center justify-center p-[5px] shrink-0">
            <Image
              src="/images/dashboard/mortgage.svg"
              alt=""
              width={24}
              height={24}
              className="size-[24px] object-contain"
            />
          </div>
          <div className="min-w-0">
            <p className="font-['Poppins',sans-serif] font-medium text-[#8B8585] text-[15px] sm:text-[16px] leading-tight">
              Household Loans(Not TC&amp;H)
            </p>
            <p className="font-['Poppins',sans-serif] font-extrabold text-[#8B8585] text-[14px] mt-1.5 leading-none">
              {formatCurrency(nonTchLoans)}
            </p>
            <div className="h-[1px] w-[94px] bg-[#CBD5E1] my-2" />
            <p className="font-['Poppins',sans-serif] font-normal text-[#8B8585] text-[13px] sm:text-[14px] leading-none">
              {nonTchPct}% Portfolio
            </p>
          </div>
        </div>
        <div className="hidden sm:block" />
      </div>

      {/* Middle Divider */}
      <div className="h-[1px] w-full bg-[#E2E8F0] my-4" />

      {/* Row 3: Fixed Rate Expiry & IO Expiry */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Card 4: Fixed Rate Expiry */}
        <div className="bg-[#F6F9FB] rounded-[12px] p-4 sm:px-5 flex items-center gap-[18px]">
          <div className="bg-white border border-[#DCE4E8] shadow-[0px_4px_2px_rgba(0,0,0,0.05)] rounded-full size-[50px] flex items-center justify-center p-[5px] shrink-0">
            <Image
              src="/images/dashboard/timer.svg"
              alt=""
              width={24}
              height={24}
              className="size-[24px] object-contain"
            />
          </div>
          <div className="min-w-0">
            <p className="font-['Poppins',sans-serif] font-medium text-[#8B8585] text-[15px] sm:text-[16px] leading-tight">
              Fixed Rate Expiry (6 months)
            </p>
            <p className="font-['Poppins',sans-serif] font-extrabold text-[#8B8585] text-[14px] mt-1.5 leading-none">
              {formatCurrency(fixedExpiryAmount)}
            </p>
            <div className="h-[1px] w-[177px] max-w-full bg-[#CBD5E1] my-2" />
            <p className="font-['Poppins',sans-serif] font-normal text-[#8B8585] text-[13px] sm:text-[14px] leading-none">
              {fixedExpiryLender}
            </p>
          </div>
        </div>

        {/* Card 5: IO Expiry */}
        <div className="bg-[#F6F9FB] rounded-[12px] p-4 sm:px-5 flex items-center gap-[18px]">
          <div className="bg-white border border-[#DCE4E8] shadow-[0px_4px_2px_rgba(0,0,0,0.05)] rounded-full size-[50px] flex items-center justify-center p-[5px] shrink-0">
            <Image
              src="/images/dashboard/gauge.svg"
              alt=""
              width={24}
              height={24}
              className="size-[24px] object-contain"
            />
          </div>
          <div className="min-w-0">
            <p className="font-['Poppins',sans-serif] font-medium text-[#8B8585] text-[15px] sm:text-[16px] leading-tight">
              IO Expiry (6 months)
            </p>
            <p className="font-['Poppins',sans-serif] font-extrabold text-[#8B8585] text-[14px] mt-1.5 leading-none">
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
