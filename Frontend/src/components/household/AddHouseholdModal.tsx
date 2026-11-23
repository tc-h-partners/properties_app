"use client";

import React, { useState } from "react";
import { X, ChevronDown } from "lucide-react";

interface AddHouseholdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddHousehold?: (household: {
    name: string;
    adviser: string;
    objectives: string;
    reviewYear: string;
  }) => Promise<void> | void;
}

export default function AddHouseholdModal({
  isOpen,
  onClose,
  onAddHousehold,
}: AddHouseholdModalProps) {
  const [householdName, setHouseholdName] = useState("");
  const [adviser, setAdviser] = useState("Sarah Jenkins (Senior Property CFO)");
  const [objectives, setObjectives] = useState("");
  const [reviewYear, setReviewYear] = useState("FY2026");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!householdName.trim() || submitting) return;

    setSubmitting(true);
    setErrorMsg("");
    try {
      if (onAddHousehold) {
        await onAddHousehold({
          name: householdName.trim(),
          adviser,
          objectives,
          reviewYear,
        });
      }
      setHouseholdName("");
      setObjectives("");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save household to database");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-[588px] bg-white rounded-[16px] shadow-2xl border border-[#E9E9E9] overflow-hidden p-6 sm:p-9 animate-in fade-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-7">
          <h2 className="text-[22px] sm:text-[24px] font-bold text-[#07315B] tracking-tight mb-1.5 font-['Poppins',sans-serif]">
            Add New Household
          </h2>
          <p className="text-[14px] sm:text-[15px] text-[#8C9BA8] font-medium font-['Poppins',sans-serif]">
            Create a new client/family profile and begin setup.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-[8px] bg-red-50 border border-red-200 text-red-600 text-[13px]">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Household Name */}
          <div>
            <label className="block text-[14px] font-medium text-[#1A1C1E] mb-2 font-['Poppins',sans-serif]">
              Household Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={householdName}
              onChange={(e) => setHouseholdName(e.target.value)}
              placeholder="e.g. The Harrison Family"
              className="w-full h-[48px] px-3.5 bg-[#F9F9F9] border border-[#DEDEDE] rounded-[10px] text-[14px] text-[#1A1C1E] placeholder-[#BCBCBC] focus:outline-none focus:ring-2 focus:ring-[#0E2841]/20 focus:border-[#0E2841] transition-all"
            />
          </div>

          {/* Adviser Assigned */}
          <div>
            <label className="block text-[14px] font-medium text-[#1A1C1E] mb-2 font-['Poppins',sans-serif]">
              Adviser Assigned
            </label>
            <div className="relative">
              <select
                value={adviser}
                onChange={(e) => setAdviser(e.target.value)}
                className="w-full h-[48px] px-3.5 pr-10 bg-[#F9F9F9] border border-[#DEDEDE] rounded-[10px] text-[14px] text-[#1A1C1E] focus:outline-none focus:ring-2 focus:ring-[#0E2841]/20 focus:border-[#0E2841] transition-all appearance-none cursor-pointer"
              >
                <option value="Sarah Jenkins (Senior Property CFO)">
                  Sarah Jenkins (Senior Property CFO)
                </option>
                <option value="Michael Zhang (Property Strategist)">
                  Michael Zhang (Property Strategist)
                </option>
                <option value="David Brown (Advisory Partner)">
                  David Brown (Advisory Partner)
                </option>
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
          </div>

          {/* Initial Review Year */}
          <div>
            <label className="block text-[14px] font-medium text-[#1A1C1E] mb-2 font-['Poppins',sans-serif]">
              Initial Review Year
            </label>
            <div className="relative">
              <select
                value={reviewYear}
                onChange={(e) => setReviewYear(e.target.value)}
                className="w-full h-[48px] px-3.5 pr-10 bg-[#F9F9F9] border border-[#DEDEDE] rounded-[10px] text-[14px] text-[#1A1C1E] focus:outline-none focus:ring-2 focus:ring-[#0E2841]/20 focus:border-[#0E2841] transition-all appearance-none cursor-pointer"
              >
                <option value="FY2026">FY2026</option>
                <option value="FY2025">FY2025</option>
                <option value="FY2024">FY2024</option>
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
          </div>

          {/* Advisory Context / Objectives */}
          <div>
            <label className="block text-[14px] font-medium text-[#1A1C1E] mb-2 font-['Poppins',sans-serif]">
              Advisory Context / Objectives
            </label>
            <textarea
              rows={3}
              value={objectives}
              onChange={(e) => setObjectives(e.target.value)}
              placeholder="Key portfolio expansion goals, tax planning requirements, or debt reduction targets..."
              className="w-full p-3 bg-[#F9F9F9] border border-[#DEDEDE] rounded-[10px] text-[14px] text-[#1A1C1E] placeholder-[#BCBCBC] focus:outline-none focus:ring-2 focus:ring-[#0E2841]/20 focus:border-[#0E2841] transition-all resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-[50px] bg-[#0E2841] hover:bg-[#153B5E] disabled:opacity-60 text-white text-[14px] font-semibold rounded-[8px] transition-colors shadow-sm cursor-pointer"
            >
              {submitting ? "Creating Household..." : "Create & Proceed to Setup"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
