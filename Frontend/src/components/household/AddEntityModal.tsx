"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, ChevronDown, Calendar } from "lucide-react";

export interface EntityFormData {
  name: string;
  type: string;
  abn: string;
  email: string;
  phone: string;
  regDate: string;
  category?: "Entity" | "Investment";
}

export interface EntityModalInitialData {
  id?: string;
  name: string;
  type?: string;
  rawType?: string;
  abn?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  regDate?: string;
  rawDate?: string;
  category?: "Entity" | "Investment";
}

interface AddEntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: EntityModalInitialData | null;
  onAddEntity?: (entity: EntityFormData) => Promise<void> | void;
  onUpdateEntity?: (
    entityId: string,
    entity: EntityFormData
  ) => Promise<void> | void;
}

function toIsoDate(dateStr?: string | null): string {
  if (!dateStr || dateStr === "---" || dateStr === "-") return "";
  const trimmed = String(dateStr).trim().replace(/^["']|["']$/g, "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})(?:\s.*)?$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, "0");
    const month = dmyMatch[2].padStart(2, "0");
    let year = dmyMatch[3];
    if (year.length === 2) {
      const yrNum = parseInt(year, 10);
      year = yrNum > 30 ? `19${year}` : `20${year}`;
    }
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    try {
      return parsed.toISOString().split("T")[0];
    } catch {
      return "";
    }
  }
  return "";
}

function formatToDisplayDate(isoDate: string): string {
  if (!isoDate) return "";
  const parts = isoDate.split("-");
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoDate;
}

export default function AddEntityModal({
  isOpen,
  onClose,
  initialData,
  onAddEntity,
  onUpdateEntity,
}: AddEntityModalProps) {
  const isEdit = Boolean(initialData?.id);
  const [category, setCategory] = useState<"Entity" | "Investment">("Entity");
  const [name, setName] = useState("");
  const [type, setType] = useState("Discretionary Trust");
  const [abn, setAbn] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [regDate, setRegDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && initialData) {
      setName(initialData.name || "");
      setCategory(initialData.category || "Entity");
      setType(initialData.rawType || initialData.type || "Discretionary Trust");
      setAbn(initialData.abn && initialData.abn !== "-" ? initialData.abn : "");
      setEmail(
        initialData.email && initialData.email !== "-" ? initialData.email : ""
      );
      setPhone(
        initialData.phone && initialData.phone !== "-"
          ? initialData.phone
          : initialData.mobile && initialData.mobile !== "-"
          ? initialData.mobile
          : ""
      );
      const rawD = initialData.rawDate || initialData.regDate || "";
      setRegDate(toIsoDate(rawD));
    } else if (isOpen) {
      setName("");
      setCategory("Entity");
      setType("Discretionary Trust");
      setAbn("");
      setEmail("");
      setPhone("");
      setRegDate("");
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !name.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !regDate.trim() ||
      submitting
    ) {
      return;
    }

    setSubmitting(true);
    try {
      const payload: EntityFormData = {
        name: name.trim(),
        type,
        abn: abn.trim() || "-",
        email: email.trim(),
        phone: phone.trim(),
        regDate: formatToDisplayDate(regDate.trim()) || regDate.trim(),
        category,
      };

      if (isEdit && initialData?.id && onUpdateEntity) {
        await onUpdateEntity(initialData.id, payload);
      } else if (onAddEntity) {
        await onAddEntity(payload);
      }

      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const titleText = isEdit
    ? category === "Investment"
      ? "Edit Investment"
      : "Edit Entity"
    : "Add New Entity";

  const subtitleText = isEdit
    ? "Update client / entity details and review record"
    : "Starting a brand-new client review record";

  const buttonText = submitting
    ? "Saving..."
    : isEdit
    ? "Save Changes"
    : "Create & Proceed to Setup";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-[588px] sm:w-[588px] sm:h-[713px] max-h-[95vh] bg-white rounded-[16px] shadow-2xl border border-[#E9E9E9] overflow-y-auto p-6 sm:p-9 animate-in fade-in zoom-in-95 duration-150 flex flex-col justify-between">
        {/* Close Button - Dark Navy Circle with White X */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#0E2841] text-white flex items-center justify-center hover:bg-[#163859] transition-colors cursor-pointer shadow-xs"
          aria-label="Close"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-5">
          <h2 className="text-[22px] sm:text-[24px] font-bold text-[#07315B] tracking-tight mb-1 font-['Poppins',sans-serif]">
            {titleText}
          </h2>
          <p className="text-[14px] text-[#8C9BA8] font-medium font-['Poppins',sans-serif]">
            {subtitleText}
          </p>
        </div>

        {/* Category Switcher: Entity | Investment */}
        <div className="bg-[#F4F4F6] p-1 rounded-[10px] flex items-center mb-4">
          <button
            type="button"
            onClick={() => setCategory("Entity")}
            className={`flex-1 py-2 text-[14px] font-['Poppins',sans-serif] rounded-[8px] transition-all cursor-pointer ${
              category === "Entity"
                ? "bg-white font-semibold text-[#0E2841] shadow-xs"
                : "font-medium text-[#6B7280] hover:text-[#0E2841]"
            }`}
          >
            Entity
          </button>
          <button
            type="button"
            onClick={() => setCategory("Investment")}
            className={`flex-1 py-2 text-[14px] font-['Poppins',sans-serif] rounded-[8px] transition-all cursor-pointer ${
              category === "Investment"
                ? "bg-white font-semibold text-[#0E2841] shadow-xs"
                : "font-medium text-[#6B7280] hover:text-[#0E2841]"
            }`}
          >
            Investment
          </button>
        </div>

        {/* Section Title */}
        <div className="mb-2">
          <h3 className="text-[16px] font-semibold text-[#07315B] font-['Poppins',sans-serif]">
            {category === "Investment" ? "Investment Details" : "Entity Details"}
          </h3>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between">
          <div className="space-y-3.5">
            <div>
              <label className="block text-[13.5px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
                {category === "Investment" ? "Investment Name" : "Name"}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Abel Summers"
                className="w-full h-[46px] px-3.5 bg-[#F9F9F9] border border-[#DEDEDE] rounded-[10px] text-[14px] text-[#1A1C1E] placeholder-[#BCBCBC] focus:outline-none focus:ring-2 focus:ring-[#0E2841]/20 focus:border-[#0E2841]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13.5px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
                  Entity Type <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    required
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full h-[46px] px-3.5 pr-8 bg-[#F9F9F9] border border-[#DEDEDE] rounded-[10px] text-[14px] text-[#1A1C1E] focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="Discretionary Trust">Discretionary Trust</option>
                    <option value="Individual">Individual</option>
                    <option value="Unit Trust">Unit Trust</option>
                    <option value="Company">Company / Corporate</option>
                    <option value="SMSF">Self-Managed Super (SMSF)</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-[13.5px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
                  ABN / ACN <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={abn}
                  onChange={(e) => setAbn(e.target.value)}
                  placeholder="e.g. 64 901 823 441"
                  className="w-full h-[46px] px-3.5 bg-[#F9F9F9] border border-[#DEDEDE] rounded-[10px] text-[14px] text-[#1A1C1E] placeholder-[#BCBCBC] focus:outline-none focus:ring-2 focus:ring-[#0E2841]/20 focus:border-[#0E2841]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13.5px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full h-[46px] px-3.5 bg-[#F9F9F9] border border-[#DEDEDE] rounded-[10px] text-[14px] text-[#1A1C1E] placeholder-[#BCBCBC] focus:outline-none focus:ring-2 focus:ring-[#0E2841]/20 focus:border-[#0E2841]"
                />
              </div>

              <div>
                <label className="block text-[13.5px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="5985554445"
                  className="w-full h-[46px] px-3.5 bg-[#F9F9F9] border border-[#DEDEDE] rounded-[10px] text-[14px] text-[#1A1C1E] placeholder-[#BCBCBC] focus:outline-none focus:ring-2 focus:ring-[#0E2841]/20 focus:border-[#0E2841]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13.5px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
                DOB or Registration Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  ref={dateInputRef}
                  type="date"
                  required
                  max={new Date().toISOString().split("T")[0]}
                  value={regDate}
                  onChange={(e) => setRegDate(e.target.value)}
                  onClick={() => {
                    try {
                      dateInputRef.current?.showPicker();
                    } catch {}
                  }}
                  className="w-full h-[46px] px-3.5 pr-10 bg-[#F9F9F9] border border-[#DEDEDE] rounded-[10px] text-[14px] text-[#1A1C1E] focus:outline-none focus:ring-2 focus:ring-[#0E2841]/20 focus:border-[#0E2841] cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-10 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => {
                    try {
                      dateInputRef.current?.showPicker();
                    } catch {
                      dateInputRef.current?.focus();
                    }
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#0E2841] transition-colors cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="pt-3 flex justify-center">
            <button
              type="submit"
              disabled={submitting}
              className="w-[335px] max-w-full h-[52px] bg-[#0E2841] hover:bg-[#153B5E] disabled:opacity-60 text-white font-['Poppins',sans-serif] font-semibold text-[14px] leading-[100%] tracking-[0px] rounded-[8px] flex items-center justify-center transition-colors shadow-sm cursor-pointer"
            >
              {buttonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
