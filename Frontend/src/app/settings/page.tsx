"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  Plus,
  Pencil,
  Save,
  Check,
  Percent,
  Sliders,
} from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import TopNav from "@/components/dashboard/TopNav";
import { fetchBenchmarksApi, createBenchmarkApi } from "@/lib/api";

interface IndexRecord {
  id: string;
  date: string;
  fy: string;
  value: number;
}

export default function SettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [asxRecords, setAsxRecords] = useState<IndexRecord[]>([]);
  const [newFy, setNewFy] = useState("FY2027");
  const [newDate, setNewDate] = useState("30/06/2027");
  const [newValue, setNewValue] = useState("");
  const [showAddFy, setShowAddFy] = useState(false);

  const [topTaxRate, setTopTaxRate] = useState("47.0");
  const [corporateTaxRate, setCorporateTaxRate] = useState("25.0");
  const [cgtDiscount, setCgtDiscount] = useState("50.0");
  const [savedSettings, setSavedSettings] = useState(false);

  const loadBenchmarksFromDb = useCallback(async () => {
    try {
      const list = await fetchBenchmarksApi();
      if (Array.isArray(list)) {
        const mapped: IndexRecord[] = list
          .filter((b: any) => b.asxIndexValue != null)
          .map((b: any) => {
            const d = new Date(b.effectiveDate);
            const dateStr = !isNaN(d.getTime())
              ? d.toLocaleDateString("en-GB")
              : "30/06/2026";
            const fyLabel =
              b.sourceNotes && b.sourceNotes.startsWith("FY")
                ? b.sourceNotes
                : `FY${d.getFullYear()}`;
            return {
              id: b.id,
              date: dateStr,
              fy: fyLabel,
              value: Number(b.asxIndexValue),
            };
          });
        setAsxRecords(mapped);
      }
    } catch (err) {
      console.error("Failed to load benchmarks from DB:", err);
    }
  }, []);

  useEffect(() => {
    loadBenchmarksFromDb();
  }, [loadBenchmarksFromDb]);

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newValue.replace(/[^0-9.]/g, ""));
    if (!val) return;

    const parts = newDate.split(/[\/\-]/);
    const isoDate =
      parts.length === 3
        ? `${parts[2].length === 2 ? `20${parts[2]}` : parts[2]}-${parts[1].padStart(
            2,
            "0"
          )}-${parts[0].padStart(2, "0")}T00:00:00.000Z`
        : new Date().toISOString();

    await createBenchmarkApi({
      effectiveDate: isoDate,
      asxIndexValue: val,
      sourceNotes: newFy,
      benchmarkInterestRate: 0.0595,
      benchmarkGrossYield: 0.041,
    });

    await loadBenchmarksFromDb();
    setNewValue("");
    setShowAddFy(false);
  };

  const handleSaveDefaults = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSettings(true);
    setTimeout(() => setSavedSettings(false), 2500);
  };

  return (
    <div className="h-screen w-full bg-[#F8F9FB] flex overflow-hidden select-none">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
        />
      )}

      <div className="flex-1 flex flex-col h-screen overflow-y-auto min-w-0">
        <TopNav onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 p-5 sm:p-7 max-w-[1360px] w-full mx-auto">
          {/* Page Heading */}
          <div className="mb-6">
            <h1 className="text-[24px] sm:text-[26px] font-semibold text-[#0F172A] tracking-tight">
              System Settings &amp; Benchmarks
            </h1>
            <p className="text-[13px] text-[#64748B] mt-0.5">
              Configure macroeconomic indices, ASX accumulation series, and
              practice-wide tax modeling parameters.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: ASX 200 Index Series (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white rounded-[14px] p-6 border border-[#E2E8F0] shadow-xs">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0E2841]/5 flex items-center justify-center text-[#0E2841]">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-[17px] font-bold text-[#0E2841]">
                        ASX 200 Accumulation Index
                      </h2>
                      <p className="text-[12.5px] text-[#64748B]">
                        Annual Historical Total Return Series for Comparative
                        Alpha.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowAddFy(!showAddFy)}
                    className="inline-flex items-center gap-1.5 bg-[#0E2841] hover:bg-[#183654] text-white px-3 py-1.5 rounded-[7px] text-[12.5px] font-medium transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add FY</span>
                  </button>
                </div>

                {/* Add FY Input Form */}
                {showAddFy && (
                  <form
                    onSubmit={handleAddRecord}
                    className="mb-5 p-4 rounded-[10px] bg-[#F8FAFC] border border-[#E2E8F0] space-y-3 animate-in fade-in duration-150"
                  >
                    <p className="text-[13px] font-semibold text-[#0E2841]">
                      New Financial Year Record
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11.5px] text-[#64748B] mb-1 font-medium">
                          Financial Year
                        </label>
                        <input
                          type="text"
                          value={newFy}
                          onChange={(e) => setNewFy(e.target.value)}
                          className="w-full h-[38px] px-3 bg-white border border-[#CBD5E1] rounded-[6px] text-[13px] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11.5px] text-[#64748B] mb-1 font-medium">
                          As of Date
                        </label>
                        <input
                          type="text"
                          value={newDate}
                          onChange={(e) => setNewDate(e.target.value)}
                          className="w-full h-[38px] px-3 bg-white border border-[#CBD5E1] rounded-[6px] text-[13px] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11.5px] text-[#64748B] mb-1 font-medium">
                          Index Value
                        </label>
                        <input
                          type="text"
                          required
                          value={newValue}
                          onChange={(e) => setNewValue(e.target.value)}
                          placeholder="e.g. 21,840"
                          className="w-full h-[38px] px-3 bg-white border border-[#CBD5E1] rounded-[6px] text-[13px] focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddFy(false)}
                        className="px-3 py-1.5 text-[12px] text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3.5 py-1.5 bg-[#0E2841] text-white text-[12px] font-medium rounded-[6px] cursor-pointer"
                      >
                        Save Value
                      </button>
                    </div>
                  </form>
                )}

                {/* Series List from DB */}
                <div className="space-y-2.5">
                  {asxRecords.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3.5 bg-[#F9F9F9] border border-[#DEDEDE] rounded-[10px] hover:border-[#CBD5E1] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-semibold text-[13px] text-[#0E2841] bg-white px-2.5 py-1 rounded-[5px] border border-gray-200 shadow-2xs">
                          {item.fy}
                        </span>
                        <span className="text-[13.5px] text-[#475569]">
                          {item.date}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[14.5px] font-mono font-bold text-[#0E2841]">
                          {item.value.toLocaleString()}
                        </span>
                        <button
                          type="button"
                          className="p-1.5 text-gray-400 hover:text-[#0E2841] rounded-[5px] hover:bg-white transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Advisory Modeling Defaults (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-[14px] p-6 border border-[#E2E8F0] shadow-xs">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#0E2841]/5 flex items-center justify-center text-[#0E2841]">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-[17px] font-bold text-[#0E2841]">
                      Advisory Assumptions
                    </h2>
                    <p className="text-[12.5px] text-[#64748B]">
                      National benchmark tax brackets &amp; hurdle rates.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSaveDefaults} className="space-y-4">
                  <div>
                    <label className="block text-[13px] font-medium text-[#1A1C1E] mb-1.5">
                      Top Marginal Personal Tax Bracket (%)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={topTaxRate}
                        onChange={(e) => setTopTaxRate(e.target.value)}
                        className="w-full h-[42px] px-3.5 bg-[#F9F9F9] border border-[#DEDEDE] rounded-[8px] text-[13.5px] font-mono font-medium text-[#0E2841] focus:outline-none"
                      />
                      <Percent className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-[#1A1C1E] mb-1.5">
                      Corporate Tax Rate (%)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={corporateTaxRate}
                        onChange={(e) => setCorporateTaxRate(e.target.value)}
                        className="w-full h-[42px] px-3.5 bg-[#F9F9F9] border border-[#DEDEDE] rounded-[8px] text-[13.5px] font-mono font-medium text-[#0E2841] focus:outline-none"
                      />
                      <Percent className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-[#1A1C1E] mb-1.5">
                      Capital Gains Tax (CGT) Discount (%)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cgtDiscount}
                        onChange={(e) => setCgtDiscount(e.target.value)}
                        className="w-full h-[42px] px-3.5 bg-[#F9F9F9] border border-[#DEDEDE] rounded-[8px] text-[13.5px] font-mono font-medium text-[#0E2841] focus:outline-none"
                      />
                      <Percent className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full h-[44px] bg-[#0E2841] hover:bg-[#183654] text-white text-[13.5px] font-semibold rounded-[8px] transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {savedSettings ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Settings Saved!</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Save Practice Defaults</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
