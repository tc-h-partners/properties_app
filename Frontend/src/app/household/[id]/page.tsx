"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Building,
  Landmark,
  TrendingUp,
  DollarSign,
  Download,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import TopNav from "@/components/dashboard/TopNav";
import AddPropertyModal from "@/components/household/AddPropertyModal";
import AddLoanModal from "@/components/household/AddLoanModal";

type TabKey = "income" | "property" | "loan" | "market";

interface IncomeRow {
  client: string;
  entity: string;
  salary: number;
  bonus: number;
  distribution: number;
  superannuation: number;
}

interface PropertyRow {
  id: string;
  name: string;
  type: string;
  purpose: string;
  purchasePrice: number;
  currentValue: number;
  rentWeekly: number;
  entity: string;
}

interface LoanRow {
  id: string;
  property: string;
  lender: string;
  type: string;
  rate: number;
  balance: number;
  offset: number;
  monthlyPayment: number;
  isTch: boolean;
}

const INITIAL_INCOME: IncomeRow[] = [
  {
    client: "Harrison Family",
    entity: "Individual",
    salary: 210000,
    bonus: 35000,
    distribution: 0,
    superannuation: 25000,
  },
  {
    client: "Sarah Harrison",
    entity: "Individual",
    salary: 185000,
    bonus: 20000,
    distribution: 0,
    superannuation: 22000,
  },
  {
    client: "Harrison Family Trust",
    entity: "Discretionary Trust",
    salary: 0,
    bonus: 0,
    distribution: 75000,
    superannuation: 0,
  },
  {
    client: "Harrison Holdings Pty Ltd",
    entity: "Corporate",
    salary: 0,
    bonus: 0,
    distribution: 45000,
    superannuation: 0,
  },
];

const INITIAL_PROPERTIES: PropertyRow[] = [
  {
    id: "prop-1",
    name: "14 Bellevue Terrace, Paddington",
    type: "House",
    purpose: "Investment",
    purchasePrice: 2450000,
    currentValue: 3100000,
    rentWeekly: 1750,
    entity: "Harrison Family Trust",
  },
  {
    id: "prop-2",
    name: "7 Waratah Street, Mona Vale",
    type: "House",
    purpose: "Principal Residence",
    purchasePrice: 1980000,
    currentValue: 2650000,
    rentWeekly: 0,
    entity: "Joint (Personal)",
  },
  {
    id: "prop-3",
    name: "22 Crown Street, Surry Hills",
    type: "Unit",
    purpose: "Investment",
    purchasePrice: 920000,
    currentValue: 1150000,
    rentWeekly: 820,
    entity: "Harrison Holdings Pty Ltd",
  },
];

const INITIAL_LOANS: LoanRow[] = [
  {
    id: "loan-1",
    property: "14 Bellevue Terrace, Paddington",
    lender: "Commonwealth Bank (CBA)",
    type: "Variable (IO)",
    rate: 5.94,
    balance: 1650000,
    offset: 120000,
    monthlyPayment: 8167,
    isTch: true,
  },
  {
    id: "loan-2",
    property: "7 Waratah Street, Mona Vale",
    lender: "Macquarie Bank",
    type: "Variable (P&I)",
    rate: 5.82,
    balance: 1240000,
    offset: 85000,
    monthlyPayment: 7289,
    isTch: true,
  },
  {
    id: "loan-3",
    property: "22 Crown Street, Surry Hills",
    lender: "Westpac (WBC)",
    type: "Fixed 2Yr (IO)",
    rate: 5.69,
    balance: 680000,
    offset: 25000,
    monthlyPayment: 3224,
    isTch: false,
  },
];

const MARKET_DATA = [
  {
    suburb: "Paddington (2021)",
    propertyType: "Houses",
    medianPrice: "$3,250,000",
    growth12m: "+8.4%",
    rentalYield: "3.2%",
    vacancyRate: "1.1%",
    clearanceRate: "78%",
  },
  {
    suburb: "Mona Vale (2103)",
    propertyType: "Houses",
    medianPrice: "$2,720,000",
    growth12m: "+6.1%",
    rentalYield: "3.5%",
    vacancyRate: "1.4%",
    clearanceRate: "72%",
  },
  {
    suburb: "Surry Hills (2010)",
    propertyType: "Units",
    medianPrice: "$1,120,000",
    growth12m: "+5.7%",
    rentalYield: "4.8%",
    vacancyRate: "1.6%",
    clearanceRate: "81%",
  },
];

export default function HouseholdDetailPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("income");
  const [properties, setProperties] = useState<PropertyRow[]>(INITIAL_PROPERTIES);
  const [loans, setLoans] = useState<LoanRow[]>(INITIAL_LOANS);
  const [incomeList, setIncomeList] = useState<IncomeRow[]>(INITIAL_INCOME);

  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);

  const totalPropertyValue = properties.reduce((acc, p) => acc + p.currentValue, 0);
  const totalLoanBalance = loans.reduce((acc, l) => acc + l.balance, 0);
  const portfolioLVR = totalPropertyValue > 0 ? ((totalLoanBalance / totalPropertyValue) * 100).toFixed(1) : "0";
  const totalOffset = loans.reduce((acc, l) => acc + l.offset, 0);

  const handleAddProperty = (p: {
    address: string;
    state: string;
    postcode: string;
    type: string;
    purpose: string;
    purchasePrice: string;
    currentValue: string;
    rentWeekly: string;
    entity: string;
  }) => {
    const newProp: PropertyRow = {
      id: `prop-${Date.now()}`,
      name: p.address,
      type: p.type,
      purpose: p.purpose,
      purchasePrice: parseFloat(p.purchasePrice.replace(/[^0-9.]/g, "")) || 0,
      currentValue: parseFloat(p.currentValue.replace(/[^0-9.]/g, "")) || 0,
      rentWeekly: parseFloat(p.rentWeekly.replace(/[^0-9.]/g, "")) || 0,
      entity: p.entity,
    };
    setProperties((prev) => [newProp, ...prev]);
  };

  const handleAddLoan = (l: {
    lender: string;
    property: string;
    loanType: string;
    rate: string;
    balance: string;
    repaymentType: string;
    offsetBalance: string;
    isTchLoan: boolean;
  }) => {
    const bal = parseFloat(l.balance.replace(/[^0-9.]/g, "")) || 0;
    const r = parseFloat(l.rate) || 5.9;
    const off = parseFloat(l.offsetBalance.replace(/[^0-9.]/g, "")) || 0;
    const monthly = Math.round(((bal - off) * (r / 100)) / 12);

    const newLoan: LoanRow = {
      id: `loan-${Date.now()}`,
      property: l.property,
      lender: l.lender,
      type: `${l.loanType} (${l.repaymentType.includes("Interest Only") ? "IO" : "P&I"})`,
      rate: r,
      balance: bal,
      offset: off,
      monthlyPayment: monthly,
      isTch: l.isTchLoan,
    };
    setLoans((prev) => [newLoan, ...prev]);
  };

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
          {/* Breadcrumb & Navigation */}
          <div className="flex items-center gap-2 mb-4 text-[13px] text-[#64748B]">
            <Link
              href="/household"
              className="inline-flex items-center gap-1.5 hover:text-[#0E2841] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Households</span>
            </Link>
            <span>/</span>
            <span className="text-[#0E2841] font-medium">The Harrison Family</span>
          </div>

          {/* Top Title Banner */}
          <div className="bg-white rounded-[14px] p-5 sm:p-6 border border-[#E2E8F0] shadow-xs mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-[20px] sm:text-[23px] font-bold text-[#0E2841] tracking-tight">
                    FINANCIAL DATA INPUT — HARRISON FAMILY
                  </h1>
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[12px] font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    FY2026 Completed
                  </span>
                </div>
                <p className="text-[13px] text-[#64748B] mt-1">
                  Comprehensive financial statements, property asset register, debt facility metrics, and local market comparables.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0E2841] px-3.5 py-2 rounded-[8px] text-[13px] font-medium transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Report</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-[#F1F5F9]">
              <div>
                <p className="text-[12px] text-[#64748B] font-medium">Portfolio Value</p>
                <p className="text-[18px] sm:text-[20px] font-bold text-[#0E2841] mt-0.5">
                  ${(totalPropertyValue / 1000000).toFixed(2)}M
                </p>
              </div>
              <div>
                <p className="text-[12px] text-[#64748B] font-medium">Total Debt</p>
                <p className="text-[18px] sm:text-[20px] font-bold text-[#0E2841] mt-0.5">
                  ${(totalLoanBalance / 1000000).toFixed(2)}M
                </p>
              </div>
              <div>
                <p className="text-[12px] text-[#64748B] font-medium">Portfolio LVR</p>
                <p className="text-[18px] sm:text-[20px] font-bold text-[#0E2841] mt-0.5">
                  {portfolioLVR}%
                </p>
              </div>
              <div>
                <p className="text-[12px] text-[#64748B] font-medium">Offset Liquidity</p>
                <p className="text-[18px] sm:text-[20px] font-bold text-emerald-600 mt-0.5">
                  ${totalOffset.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Sub-tabs Navigation */}
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            <div className="inline-flex items-center bg-white p-1 rounded-[10px] border border-[#E2E8F0] shadow-2xs">
              {[
                { key: "income", label: "Household Income", icon: DollarSign },
                { key: "property", label: "Property Data", icon: Building },
                { key: "loan", label: "Loan Data", icon: Landmark },
                { key: "market", label: "Market Data", icon: TrendingUp },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as TabKey)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-[7px] text-[13px] font-medium transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#0E2841] text-white shadow-xs font-semibold"
                        : "text-[#64748B] hover:text-[#0E2841] hover:bg-[#F8FAFC]"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Context Action Button */}
            {activeTab === "property" && (
              <button
                onClick={() => setIsPropertyModalOpen(true)}
                className="inline-flex items-center gap-2 bg-[#0E2841] hover:bg-[#183654] text-white px-3.5 py-2 rounded-[8px] text-[13px] font-medium transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Property</span>
              </button>
            )}

            {activeTab === "loan" && (
              <button
                onClick={() => setIsLoanModalOpen(true)}
                className="inline-flex items-center gap-2 bg-[#0E2841] hover:bg-[#183654] text-white px-3.5 py-2 rounded-[8px] text-[13px] font-medium transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Loan Facility</span>
              </button>
            )}
          </div>

          {/* Tab 1: Household Income */}
          {activeTab === "income" && (
            <div className="bg-white rounded-[12px] border border-[#E2E8F0] shadow-xs overflow-hidden">
              <div className="p-5 border-b border-[#E2E8F0]">
                <h3 className="text-[16px] font-bold text-[#0E2841]">
                  1. Household Income & Liquidity
                </h3>
                <p className="text-[13px] text-[#64748B] mt-0.5">
                  Annual earned remuneration, superannuation, and distributions for household entities in FY2026.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                      <th className="py-3 px-5 text-[12px] font-semibold text-[#64748B] uppercase">Client / Name</th>
                      <th className="py-3 px-5 text-[12px] font-semibold text-[#64748B] uppercase">Entity</th>
                      <th className="py-3 px-5 text-[12px] font-semibold text-[#64748B] uppercase text-right">Salary ($)</th>
                      <th className="py-3 px-5 text-[12px] font-semibold text-[#64748B] uppercase text-right">Bonus ($)</th>
                      <th className="py-3 px-5 text-[12px] font-semibold text-[#64748B] uppercase text-right">Distribution ($)</th>
                      <th className="py-3 px-5 text-[12px] font-semibold text-[#64748B] uppercase text-right">Super ($)</th>
                      <th className="py-3 px-5 text-[12px] font-semibold text-[#64748B] uppercase text-right">Total ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {incomeList.map((row, idx) => {
                      const total = row.salary + row.bonus + row.distribution + row.superannuation;
                      return (
                        <tr key={idx} className="hover:bg-[#F8FAFC] transition-colors">
                          <td className="py-3.5 px-5 text-[13.5px] font-semibold text-[#0E2841]">{row.client}</td>
                          <td className="py-3.5 px-5 text-[13.5px] text-[#64748B]">{row.entity}</td>
                          <td className="py-3.5 px-5 text-[13.5px] text-right font-mono text-[#0F172A]">${row.salary.toLocaleString()}</td>
                          <td className="py-3.5 px-5 text-[13.5px] text-right font-mono text-[#0F172A]">${row.bonus.toLocaleString()}</td>
                          <td className="py-3.5 px-5 text-[13.5px] text-right font-mono text-[#0F172A]">${row.distribution.toLocaleString()}</td>
                          <td className="py-3.5 px-5 text-[13.5px] text-right font-mono text-[#0F172A]">${row.superannuation.toLocaleString()}</td>
                          <td className="py-3.5 px-5 text-[13.5px] text-right font-mono font-bold text-[#0E2841] bg-slate-50/50">${total.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#F8FAFC] font-semibold border-t-2 border-[#E2E8F0]">
                      <td colSpan={2} className="py-3.5 px-5 text-[13.5px] text-[#0E2841]">Total Household Remuneration</td>
                      <td className="py-3.5 px-5 text-[13.5px] text-right font-mono text-[#0E2841]">
                        ${incomeList.reduce((acc, i) => acc + i.salary, 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-5 text-[13.5px] text-right font-mono text-[#0E2841]">
                        ${incomeList.reduce((acc, i) => acc + i.bonus, 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-5 text-[13.5px] text-right font-mono text-[#0E2841]">
                        ${incomeList.reduce((acc, i) => acc + i.distribution, 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-5 text-[13.5px] text-right font-mono text-[#0E2841]">
                        ${incomeList.reduce((acc, i) => acc + i.superannuation, 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-5 text-[13.5px] text-right font-mono text-[#0E2841] bg-slate-100 font-bold">
                        ${incomeList
                          .reduce((acc, i) => acc + i.salary + i.bonus + i.distribution + i.superannuation, 0)
                          .toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Tab 2: Property Data */}
          {activeTab === "property" && (
            <div className="bg-white rounded-[12px] border border-[#E2E8F0] shadow-xs overflow-hidden">
              <div className="p-5 border-b border-[#E2E8F0]">
                <h3 className="text-[16px] font-bold text-[#0E2841]">
                  2. Real Estate Asset Portfolio
                </h3>
                <p className="text-[13px] text-[#64748B] mt-0.5">
                  Residential and commercial properties held across household entities.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                      <th className="py-3 px-5 text-[12px] font-semibold text-[#64748B] uppercase">Property Name</th>
                      <th className="py-3 px-5 text-[12px] font-semibold text-[#64748B] uppercase">Type</th>
                      <th className="py-3 px-5 text-[12px] font-semibold text-[#64748B] uppercase">Purpose</th>
                      <th className="py-3 px-5 text-[12px] font-semibold text-[#64748B] uppercase">Ownership Entity</th>
                      <th className="py-3 px-5 text-[12px] font-semibold text-[#64748B] uppercase text-right">Purchase Price</th>
                      <th className="py-3 px-5 text-[12px] font-semibold text-[#64748B] uppercase text-right">Current Value</th>
                      <th className="py-3 px-5 text-[12px] font-semibold text-[#64748B] uppercase text-right">Weekly Rent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {properties.map((prop) => (
                      <tr key={prop.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-3.5 px-5 text-[13.5px] font-semibold text-[#0E2841]">{prop.name}</td>
                        <td className="py-3.5 px-5 text-[13px] text-[#64748B]">{prop.type}</td>
                        <td className="py-3.5 px-5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11.5px] font-medium ${
                              prop.purpose === "Investment"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-purple-50 text-purple-700 border border-purple-200"
                            }`}
                          >
                            {prop.purpose}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-[13px] text-[#475569]">{prop.entity}</td>
                        <td className="py-3.5 px-5 text-[13.5px] text-right font-mono text-[#0F172A]">${prop.purchasePrice.toLocaleString()}</td>
                        <td className="py-3.5 px-5 text-[13.5px] text-right font-mono font-bold text-[#0E2841]">${prop.currentValue.toLocaleString()}</td>
                        <td className="py-3.5 px-5 text-[13.5px] text-right font-mono text-emerald-600 font-medium">
                          {prop.rentWeekly > 0 ? `$${prop.rentWeekly}/wk` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#F8FAFC] font-semibold border-t-2 border-[#E2E8F0]">
                      <td colSpan={5} className="py-3.5 px-5 text-[13.5px] text-[#0E2841]">Total Portfolio Value</td>
                      <td className="py-3.5 px-5 text-[13.5px] text-right font-mono text-[#0E2841] bg-slate-100 font-bold">
                        ${totalPropertyValue.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-5 text-[13.5px] text-right font-mono text-emerald-700 font-bold">
                        ${properties.reduce((acc, p) => acc + p.rentWeekly, 0)}/wk
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Tab 3: Loan Data */}
          {activeTab === "loan" && (
            <div className="bg-white rounded-[12px] border border-[#E2E8F0] shadow-xs overflow-hidden">
              <div className="p-5 border-b border-[#E2E8F0]">
                <h3 className="text-[16px] font-bold text-[#0E2841]">
                  3. Debt Facilities & Mortgages
                </h3>
                <p className="text-[13px] text-[#64748B] mt-0.5">
                  Lender breakdown, interest rates, debt service costs, and offset buffers.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                      <th className="py-3 px-5 text-[12px] font-semibold text-[#64748B] uppercase">Lender</th>
                      <th className="py-3 px-5 text-[12px] font-semibold text-[#64748B] uppercase">Property</th>
                      <th className="py-3 px-5 text-[12px] font-semibold text-[#64748B] uppercase">Facility Type</th>
                      <th className="py-3 px-5 text-[12px] font-semibold text-[#64748B] uppercase">Rate</th>
                      <th className="py-3 px-5 text-[12px] font-semibold text-[#64748B] uppercase text-right">Balance</th>
                      <th className="py-3 px-5 text-[12px] font-semibold text-[#64748B] uppercase text-right">Offset Balance</th>
                      <th className="py-3 px-5 text-[12px] font-semibold text-[#64748B] uppercase text-right">Monthly Repayment</th>
                      <th className="py-3 px-5 text-[12px] font-semibold text-[#64748B] uppercase text-center">TC&H Originated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {loans.map((loan) => (
                      <tr key={loan.id} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-3.5 px-5 text-[13.5px] font-semibold text-[#0E2841]">{loan.lender}</td>
                        <td className="py-3.5 px-5 text-[13px] text-[#475569]">{loan.property}</td>
                        <td className="py-3.5 px-5 text-[13px] text-[#64748B]">{loan.type}</td>
                        <td className="py-3.5 px-5 text-[13.5px] font-mono font-medium text-[#0E2841]">{loan.rate}%</td>
                        <td className="py-3.5 px-5 text-[13.5px] text-right font-mono font-bold text-[#0F172A]">${loan.balance.toLocaleString()}</td>
                        <td className="py-3.5 px-5 text-[13.5px] text-right font-mono text-emerald-600 font-medium">${loan.offset.toLocaleString()}</td>
                        <td className="py-3.5 px-5 text-[13.5px] text-right font-mono text-[#0E2841]">${loan.monthlyPayment.toLocaleString()}/mo</td>
                        <td className="py-3.5 px-5 text-center">
                          {loan.isTch ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              TC&H Managed
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600">
                              External
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#F8FAFC] font-semibold border-t-2 border-[#E2E8F0]">
                      <td colSpan={4} className="py-3.5 px-5 text-[13.5px] text-[#0E2841]">Total Debt Portfolio</td>
                      <td className="py-3.5 px-5 text-[13.5px] text-right font-mono text-[#0E2841] bg-slate-100 font-bold">
                        ${totalLoanBalance.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-5 text-[13.5px] text-right font-mono text-emerald-700 font-bold">
                        ${totalOffset.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-5 text-[13.5px] text-right font-mono text-[#0E2841] font-bold">
                        ${loans.reduce((acc, l) => acc + l.monthlyPayment, 0).toLocaleString()}/mo
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Tab 4: Market Data */}
          {activeTab === "market" && (
            <div className="bg-white rounded-[12px] border border-[#E2E8F0] shadow-xs overflow-hidden">
              <div className="p-5 border-b border-[#E2E8F0]">
                <h3 className="text-[16px] font-bold text-[#0E2841]">
                  4. Local Market Benchmarks & Analytics
                </h3>
                <p className="text-[13px] text-[#64748B] mt-0.5">
                  Historical capital growth, gross rental yields, and liquidity dynamics for held properties.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                      <th className="py-3 px-5 text-[12px] font-semibold text-[#64748B] uppercase">Target Suburb / LGA</th>
                      <th className="py-3 px-5 text-[12px] font-semibold text-[#64748B] uppercase">Asset Class</th>
                      <th className="py-3 px-5 text-[12px] font-semibold text-[#64748B] uppercase text-right">Median Price</th>
                      <th className="py-3 px-5 text-[12px] font-semibold text-[#64748B] uppercase text-right">12M Capital Growth</th>
                      <th className="py-3 px-5 text-[12px] font-semibold text-[#64748B] uppercase text-right">Gross Rental Yield</th>
                      <th className="py-3 px-5 text-[12px] font-semibold text-[#64748B] uppercase text-right">Vacancy Rate</th>
                      <th className="py-3 px-5 text-[12px] font-semibold text-[#64748B] uppercase text-right">Auction Clearance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {MARKET_DATA.map((item, idx) => (
                      <tr key={idx} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="py-3.5 px-5 text-[13.5px] font-semibold text-[#0E2841]">{item.suburb}</td>
                        <td className="py-3.5 px-5 text-[13px] text-[#64748B]">{item.propertyType}</td>
                        <td className="py-3.5 px-5 text-[13.5px] text-right font-mono font-medium text-[#0F172A]">{item.medianPrice}</td>
                        <td className="py-3.5 px-5 text-[13.5px] text-right font-mono font-semibold text-emerald-600">{item.growth12m}</td>
                        <td className="py-3.5 px-5 text-[13.5px] text-right font-mono text-[#0F172A]">{item.rentalYield}</td>
                        <td className="py-3.5 px-5 text-[13.5px] text-right font-mono text-[#475569]">{item.vacancyRate}</td>
                        <td className="py-3.5 px-5 text-[13.5px] text-right font-mono font-medium text-[#0E2841]">{item.clearanceRate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <AddPropertyModal
        isOpen={isPropertyModalOpen}
        onClose={() => setIsPropertyModalOpen(false)}
        onAddProperty={handleAddProperty}
      />

      <AddLoanModal
        isOpen={isLoanModalOpen}
        onClose={() => setIsLoanModalOpen(false)}
        onAddLoan={handleAddLoan}
      />
    </div>
  );
}
