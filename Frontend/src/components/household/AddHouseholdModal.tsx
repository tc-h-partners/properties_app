"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { X, ChevronDown } from "lucide-react";
import {
  AdvisorItem,
  getCachedAdvisors,
  fetchSystemSettingsApi,
  formatAdvisorLabel,
} from "@/lib/api";

interface AddHouseholdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddHousehold?: (household: {
    name: string;
    adviser: string;
    objectives: string;
    reviewYear?: string;
  }) => Promise<void> | void;
}

export default function AddHouseholdModal({
  isOpen,
  onClose,
  onAddHousehold,
}: AddHouseholdModalProps) {
  const [householdName, setHouseholdName] = useState("");
  const [advisors, setAdvisors] = useState<AdvisorItem[]>(getCachedAdvisors());
  const [adviser, setAdviser] = useState<string>(() => {
    const cached = getCachedAdvisors();
    return cached.length > 0
      ? formatAdvisorLabel(cached[0])
      : "Sarah Jenkins (Senior Property CFO)";
  });
  const [objectives, setObjectives] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Sync latest advisers from settings/backend when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const syncAdvisors = async () => {
      try {
        const data = await fetchSystemSettingsApi();
        if (data?.advisors && Array.isArray(data.advisors) && data.advisors.length > 0) {
          setAdvisors(data.advisors);
          // Default screen to the first advisor
          setAdviser(formatAdvisorLabel(data.advisors[0]));
        } else {
          const cached = getCachedAdvisors();
          if (cached.length > 0) {
            setAdvisors(cached);
            setAdviser(formatAdvisorLabel(cached[0]));
          }
        }
      } catch {
        const cached = getCachedAdvisors();
        if (cached.length > 0) {
          setAdvisors(cached);
          setAdviser(formatAdvisorLabel(cached[0]));
        }
      }
    };

    syncAdvisors();
  }, [isOpen]);

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
          reviewYear: "FY2026",
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
      <div className="relative w-full max-w-[588px] sm:w-[588px] sm:h-[588px] max-h-[95vh] bg-white rounded-[16px] shadow-2xl border border-[#E9E9E9] overflow-y-auto p-6 sm:p-9 animate-in fade-in zoom-in-95 duration-150 flex flex-col justify-between">
        {/* Close Button - Navy Circle with White X */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#0E2841] text-white flex items-center justify-center hover:bg-[#163859] transition-colors cursor-pointer shadow-xs"
          aria-label="Close"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <h2 className="text-[22px] sm:text-[24px] font-bold text-[#07315B] tracking-tight mb-1 font-['Poppins',sans-serif]">
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
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between">
          <div className="space-y-4">
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
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[14px] font-medium text-[#1A1C1E] font-['Poppins',sans-serif]">
                  Adviser Assigned
                </label>
                <Link
                  href="/settings?tab=advisors"
                  onClick={onClose}
                  className="text-[12px] text-[#07315B] hover:text-[#0E2841] hover:underline font-medium font-['Poppins',sans-serif]"
                >
                  Edit in Settings
                </Link>
              </div>
              <div className="relative">
                <select
                  value={adviser}
                  onChange={(e) => setAdviser(e.target.value)}
                  className="w-full h-[48px] px-3.5 pr-10 bg-[#F9F9F9] border border-[#DEDEDE] rounded-[10px] text-[14px] text-[#1A1C1E] focus:outline-none focus:ring-2 focus:ring-[#0E2841]/20 focus:border-[#0E2841] transition-all appearance-none cursor-pointer"
                >
                  {advisors.map((adv) => {
                    const label = formatAdvisorLabel(adv);
                    return (
                      <option key={adv.id || label} value={label}>
                        {label}
                      </option>
                    );
                  })}
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
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex justify-center">
            <button
              type="submit"
              disabled={submitting}
              className="w-[335px] max-w-full h-[52px] bg-[#0E2841] hover:bg-[#153B5E] disabled:opacity-60 text-white font-['Poppins',sans-serif] font-semibold text-[14px] leading-[100%] tracking-[0px] rounded-[8px] flex items-center justify-center transition-colors shadow-sm cursor-pointer"
            >
              {submitting ? "Creating Household..." : "Create & Proceed to Setup"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
