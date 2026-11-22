"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Search, Eye, MoreVertical, ChevronDown } from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import TopNav from "@/components/dashboard/TopNav";
import AddHouseholdModal from "@/components/household/AddHouseholdModal";

interface HouseholdRow {
  id: string;
  name: string;
  reviewYear: string;
  reviewStatus: "COMPLETED" | "NOT STARTED" | "IN PROGRESS";
  reviewDate: string;
  executiveReport: "Acknowledged" | "Locked (Pending Review)" | "Available (Unacknowledged)";
  workflowStatus: "COMPLETED" | "IN PROGRESS";
}

const FIGMA_HOUSEHOLDS: HouseholdRow[] = [
  {
    id: "harrison-family",
    name: "THE HARRISON FAMILY",
    reviewYear: "FY2025",
    reviewStatus: "COMPLETED",
    reviewDate: "2026-10-06",
    executiveReport: "Acknowledged",
    workflowStatus: "COMPLETED",
  },
  {
    id: "laeonardo-decaprio-1",
    name: "LAEONARDO DECAPRIO",
    reviewYear: "FY2026",
    reviewStatus: "NOT STARTED",
    reviewDate: "2026-10-06",
    executiveReport: "Locked (Pending Review)",
    workflowStatus: "IN PROGRESS",
  },
  {
    id: "laeonardo-decaprio-2",
    name: "LAEONARDO DECAPRIO",
    reviewYear: "FY2026",
    reviewStatus: "COMPLETED",
    reviewDate: "2026-10-06",
    executiveReport: "Acknowledged",
    workflowStatus: "COMPLETED",
  },
  {
    id: "john-doe",
    name: "JOHN DOE",
    reviewYear: "FY2026",
    reviewStatus: "NOT STARTED",
    reviewDate: "2026-10-06",
    executiveReport: "Locked (Pending Review)",
    workflowStatus: "IN PROGRESS",
  },
  {
    id: "laeonardo-decaprio-3",
    name: "LAEONARDO DECAPRIO",
    reviewYear: "FY2026",
    reviewStatus: "COMPLETED",
    reviewDate: "2026-10-06",
    executiveReport: "Acknowledged",
    workflowStatus: "COMPLETED",
  },
  {
    id: "laeonardo-decaprio-4",
    name: "LAEONARDO DECAPRIO",
    reviewYear: "FY2026",
    reviewStatus: "COMPLETED",
    reviewDate: "2026-10-06",
    executiveReport: "Available (Unacknowledged)",
    workflowStatus: "COMPLETED",
  },
  {
    id: "kaiser-brown",
    name: "KAISER BROWN",
    reviewYear: "FY2026",
    reviewStatus: "NOT STARTED",
    reviewDate: "2026-10-06",
    executiveReport: "Locked (Pending Review)",
    workflowStatus: "IN PROGRESS",
  },
];

export default function HouseholdPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [households, setHouseholds] = useState<HouseholdRow[]>(FIGMA_HOUSEHOLDS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState<"All" | "In Progress" | "Completed">("All");

  const filteredHouseholds = useMemo(() => {
    return households.filter((h) => {
      const matchesSearch =
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.reviewYear.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTab =
        selectedTab === "All" ||
        (selectedTab === "In Progress" && h.workflowStatus === "IN PROGRESS") ||
        (selectedTab === "Completed" && h.workflowStatus === "COMPLETED");

      return matchesSearch && matchesTab;
    });
  }, [households, searchQuery, selectedTab]);

  const handleAddHousehold = (newH: {
    name: string;
    adviser: string;
    objectives: string;
    reviewYear: string;
  }) => {
    const item: HouseholdRow = {
      id: newH.name.toLowerCase().replace(/\s+/g, "-"),
      name: newH.name.toUpperCase(),
      reviewYear: newH.reviewYear,
      reviewStatus: "IN PROGRESS",
      reviewDate: new Date().toISOString().split("T")[0],
      executiveReport: "Locked (Pending Review)",
      workflowStatus: "IN PROGRESS",
    };
    setHouseholds((prev) => [item, ...prev]);
  };

  return (
    <div className="min-h-screen bg-white flex select-none">
      {/* Sidebar matching Figma Household Setup */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 p-6 sm:p-8 max-w-[1240px] w-full">
          {/* Page Heading */}
          <div className="mb-6">
            <h1 className="font-['Poppins',sans-serif] font-bold text-[#1A1C1E] text-[18px] sm:text-[20px] tracking-[-0.36px]">
              Households
            </h1>
          </div>

          {/* Controls Bar matching Figma: Add Button + Search + Filter Pills */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            {/* Left Controls */}
            <div className="flex items-center gap-4 flex-wrap">
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-[#0E2841] hover:bg-[#183654] text-white h-[41px] px-[15px] rounded-[8px] font-['Poppins',sans-serif] text-[14px] font-medium flex items-center gap-[10px] transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.2]" />
                <span>Add New Household</span>
              </button>

              <div className="bg-[#F2F1F2] h-[41px] px-[11px] rounded-[8px] flex items-center gap-[9px] w-[231px]">
                <Search className="w-4 h-4 text-[#A3A3A3] shrink-0" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent font-['Inter',sans-serif] text-[14px] text-[#1A1C1E] placeholder-[#A3A3A3] focus:outline-none"
                />
              </div>
            </div>

            {/* Right: Filter Pills matching Figma */}
            <div className="bg-[#F2F1F2] rounded-[10px] p-[4px] flex items-center gap-[6px] self-start md:self-auto">
              <button
                onClick={() => setSelectedTab("All")}
                className={`px-[10px] py-[4px] rounded-[6px] text-[14px] font-['Poppins',sans-serif] transition-all cursor-pointer ${
                  selectedTab === "All"
                    ? "bg-white text-[#07315B] shadow-[0px_4px_7px_rgba(0,0,0,0.25)] font-semibold"
                    : "text-[#A0A0A0] font-medium hover:text-[#1A1C1E]"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedTab("In Progress")}
                className={`px-[6px] py-[4px] rounded-[6px] text-[14px] font-['Poppins',sans-serif] transition-all cursor-pointer ${
                  selectedTab === "In Progress"
                    ? "bg-white text-[#07315B] shadow-[0px_4px_7px_rgba(0,0,0,0.25)] font-semibold"
                    : "text-[#A0A0A0] font-medium hover:text-[#1A1C1E]"
                }`}
              >
                In Progress
              </button>
              <button
                onClick={() => setSelectedTab("Completed")}
                className={`px-[6px] py-[4px] rounded-[6px] text-[14px] font-['Poppins',sans-serif] transition-all cursor-pointer ${
                  selectedTab === "Completed"
                    ? "bg-white text-[#07315B] shadow-[0px_4px_7px_rgba(0,0,0,0.25)] font-semibold"
                    : "text-[#A0A0A0] font-medium hover:text-[#1A1C1E]"
                }`}
              >
                Completed
              </button>
            </div>
          </div>

          {/* Table matching Figma Household Setup */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0]">
                  <th className="py-3 px-3 font-['Poppins',sans-serif] font-medium text-[13px] text-[#ACB5BB] uppercase tracking-[-0.28px]">
                    <div className="flex items-center gap-1.5 cursor-pointer">
                      <span>HOUSEHOLD</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="py-3 px-3 font-['Poppins',sans-serif] font-medium text-[13px] text-[#ACB5BB] tracking-[-0.28px]">
                    <div className="flex items-center gap-1.5 cursor-pointer">
                      <span>Latest Review Year</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="py-3 px-3 font-['Poppins',sans-serif] font-medium text-[13px] text-[#ACB5BB] tracking-[-0.28px]">
                    <div className="flex items-center gap-1.5 cursor-pointer">
                      <span>Review status</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="py-3 px-3 font-['Poppins',sans-serif] font-medium text-[13px] text-[#ACB5BB] tracking-[-0.28px]">
                    <div className="flex items-center gap-1.5 cursor-pointer">
                      <span>Executive Report</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="py-3 px-3 font-['Poppins',sans-serif] font-medium text-[13px] text-[#ACB5BB] tracking-[-0.28px]">
                    <div className="flex items-center gap-1.5 cursor-pointer">
                      <span>Workflow Status</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th className="py-3 px-3 font-['Poppins',sans-serif] font-medium text-[13px] text-[#ACB5BB] tracking-[-0.28px] text-right">
                    <div className="flex items-center justify-end gap-1.5 cursor-pointer">
                      <span>Actions</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filteredHouseholds.map((row) => (
                  <tr key={row.id} className="hover:bg-[#F8FAFC] transition-colors">
                    {/* Household Name */}
                    <td className="py-4 px-3">
                      <Link
                        href={`/household/${row.id}`}
                        className="font-['Poppins',sans-serif] font-medium text-[14px] text-[#1A1C1E] tracking-[-0.28px] uppercase hover:text-blue-600 transition-colors"
                      >
                        {row.name}
                      </Link>
                    </td>

                    {/* Latest Review Year */}
                    <td className="py-4 px-3 font-['Poppins',sans-serif] font-medium text-[14px] text-[#1A1C1E] tracking-[-0.28px]">
                      {row.reviewYear}
                    </td>

                    {/* Review Status & Date */}
                    <td className="py-4 px-3">
                      <div className="flex flex-col">
                        <span className="font-['Poppins',sans-serif] font-medium text-[13px] text-[#1A1C1E]">
                          {row.reviewStatus}
                        </span>
                        <span className="font-['Poppins',sans-serif] text-[11px] text-[#8C9BA8]">
                          Review Date: {row.reviewDate}
                        </span>
                      </div>
                    </td>

                    {/* Executive Report */}
                    <td className="py-4 px-3 font-['Poppins',sans-serif] text-[13.5px] text-[#1A1C1E]">
                      {row.executiveReport}
                    </td>

                    {/* Workflow Status Badge */}
                    <td className="py-4 px-3">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-[12px] font-['Poppins',sans-serif] font-semibold tracking-wide uppercase ${
                          row.workflowStatus === "COMPLETED"
                            ? "bg-[#D1FADF] text-[#027A48]"
                            : "bg-[#FEF0C7] text-[#B54708]"
                        }`}
                      >
                        {row.workflowStatus}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-3 text-right">
                      <div className="flex items-center justify-end gap-2 text-[#94A3B8]">
                        <Link
                          href={`/household/${row.id}`}
                          className="p-1 hover:text-[#0E2841] transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          className="p-1 hover:text-[#0E2841] transition-colors cursor-pointer"
                          title="Options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* Add Household Modal */}
      <AddHouseholdModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddHousehold={handleAddHousehold}
      />
    </div>
  );
}
