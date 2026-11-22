"use client";

import React, { useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import TopNav from "@/components/dashboard/TopNav";
import HouseholdCard from "@/components/dashboard/HouseholdCard";
import SearchCard from "@/components/dashboard/SearchCard";
import LoanMetrics from "@/components/dashboard/LoanMetrics";
import ReviewStatus from "@/components/dashboard/ReviewStatus";

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex select-none">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
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
            <HouseholdCard />
            <SearchCard />
          </div>

          {/* Main Grid: Loan Metrics (Left) & Review Status (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left Column: Loan Metrics (7.5 cols approx) */}
            <div className="lg:col-span-7 xl:col-span-7">
              <LoanMetrics />
            </div>

            {/* Right Column: Review Status (4.5 cols approx) */}
            <div className="lg:col-span-5 xl:col-span-5">
              <ReviewStatus />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
