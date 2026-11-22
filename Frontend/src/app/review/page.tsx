"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building,
  TrendingUp,
  Download,
  AlertCircle,
  FileCheck,
  CheckCircle,
  BarChart3,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import TopNav from "@/components/dashboard/TopNav";

type ReviewTab = "executive" | "portfolio" | "property" | "outlook" | "insights";

export default function ReviewWorkspacePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ReviewTab>("portfolio");

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex select-none">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <TopNav onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 p-5 sm:p-7 max-w-[1360px] w-full mx-auto">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 mb-4 text-[13px] text-[#64748B]">
            <Link
              href="/household"
              className="inline-flex items-center gap-1.5 hover:text-[#0E2841] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Review Workspace</span>
            </Link>
            <span>/</span>
            <span className="text-[#0E2841] font-medium">Harrison Family FY2026 Annual Report</span>
          </div>

          {/* Title Banner */}
          <div className="bg-white rounded-[14px] p-5 sm:p-6 border border-[#E2E8F0] shadow-xs mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-[21px] sm:text-[24px] font-bold text-[#0E2841] tracking-tight">
                  The Property Investor CFO Annual Report — Harrison Family 2026
                </h1>
                <p className="text-[13.5px] text-[#64748B] mt-1">
                  Advisory diagnostic report prepared by TC&H Partners for wealth accumulation and debt optimization.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Status: Review In Progress
                </span>

                <button
                  type="button"
                  className="inline-flex items-center gap-2 bg-[#0E2841] hover:bg-[#183654] text-white px-3.5 py-2 rounded-[8px] text-[13px] font-medium transition-colors shadow-xs cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF Report</span>
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center overflow-x-auto gap-2 bg-white p-1.5 rounded-[12px] border border-[#E2E8F0] shadow-2xs mb-6">
            {[
              { key: "executive", label: "Executive Summary" },
              { key: "portfolio", label: "Portfolio Overview" },
              { key: "property", label: "Property Analysis" },
              { key: "outlook", label: "Interactive Future Outlook" },
              { key: "insights", label: "Portfolio Management Insights" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as ReviewTab)}
                className={`px-4 py-2 rounded-[8px] text-[13px] font-medium transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === tab.key
                    ? "bg-[#0E2841] text-white shadow-xs font-semibold"
                    : "text-[#64748B] hover:text-[#0E2841] hover:bg-[#F8FAFC]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content: Portfolio Overview */}
          {activeTab === "portfolio" && (
            <div className="space-y-6">
              {/* Balance Sheet Summary Cards */}
              <div>
                <h3 className="text-[16px] font-bold text-[#0E2841] mb-3">
                  Portfolio Summary (Balance Sheet)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Property Value */}
                  <div className="bg-[#F6F9FB] rounded-[14px] p-5 border border-[#E2E8F0]">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-white shadow-2xs flex items-center justify-center text-[#0E2841]">
                        <Building className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[12px] text-[#64748B] font-medium">Total Property Value</p>
                        <p className="text-[22px] font-bold text-[#0E2841]">$6,900,000</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-[#E2E8F0]/70 flex items-center justify-between text-[12px]">
                      <span className="text-[#64748B]">Capital Appreciation</span>
                      <span className="text-emerald-600 font-semibold">+12.4% vs FY2025</span>
                    </div>
                  </div>

                  {/* Total Loans */}
                  <div className="bg-[#F6F9FB] rounded-[14px] p-5 border border-[#E2E8F0]">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-white shadow-2xs flex items-center justify-center text-[#0E2841]">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[12px] text-[#64748B] font-medium">Total Debt Liabilities</p>
                        <p className="text-[22px] font-bold text-[#0E2841]">$3,570,000</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-[#E2E8F0]/70 flex items-center justify-between text-[12px]">
                      <span className="text-[#64748B]">Weighted Avg Rate</span>
                      <span className="text-[#0E2841] font-semibold">5.85% p.a.</span>
                    </div>
                  </div>

                  {/* Net Equity */}
                  <div className="bg-[#F6F9FB] rounded-[14px] p-5 border border-[#E2E8F0]">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-white shadow-2xs flex items-center justify-center text-emerald-600">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[12px] text-[#64748B] font-medium">Net Real Estate Equity</p>
                        <p className="text-[22px] font-bold text-emerald-700">$3,330,000</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-[#E2E8F0]/70 flex items-center justify-between text-[12px]">
                      <span className="text-[#64748B]">Overall Portfolio LVR</span>
                      <span className="text-[#0E2841] font-semibold">51.7% (Healthy)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Strategic Observations */}
              <div className="bg-white rounded-[14px] p-6 border border-[#E2E8F0] shadow-xs">
                <h3 className="text-[16px] font-bold text-[#0E2841] mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Strategic Observations & Advisor Recommendations</span>
                </h3>

                <div className="space-y-4">
                  <div className="p-4 rounded-[10px] bg-slate-50 border border-slate-200">
                    <h4 className="text-[14px] font-semibold text-[#0E2841] mb-1">
                      1. Debt Restructure & Offset Consolidation
                    </h4>
                    <p className="text-[13px] text-[#475569] leading-relaxed">
                      The current non-deductible debt on 7 Waratah Street ($1.24M) can be accelerated by funneling surplus distributions from Harrison Family Trust ($75K) directly into its primary 100% offset account, saving approximately $14,200 annually in post-tax interest.
                    </p>
                  </div>

                  <div className="p-4 rounded-[10px] bg-slate-50 border border-slate-200">
                    <h4 className="text-[14px] font-semibold text-[#0E2841] mb-1">
                      2. Equity Release for FY2027 Acquisition
                    </h4>
                    <p className="text-[13px] text-[#475569] leading-relaxed">
                      With 14 Bellevue Terrace valued at $3.1M against $1.65M debt (53% LVR), a usable equity release of up to $830,000 is available up to 80% LVR without incurring Lenders Mortgage Insurance (LMI).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Other Tabs Placeholder */}
          {activeTab !== "portfolio" && (
            <div className="bg-white rounded-[14px] p-12 text-center border border-[#E2E8F0] shadow-xs">
              <BarChart3 className="w-12 h-12 text-[#94A3B8] mx-auto mb-3" />
              <h3 className="text-[16px] font-semibold text-[#0E2841] capitalize">
                {activeTab.replace("-", " ")} Workspace
              </h3>
              <p className="text-[13px] text-[#64748B] max-w-md mx-auto mt-1">
                Detailed quantitative modeling for {activeTab.replace("-", " ")} is prepared based on FY2026 data. Select Portfolio Overview to review core balance sheet diagnostics.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
