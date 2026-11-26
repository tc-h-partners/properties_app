"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { X, ChevronDown, Check, Calendar, Trash2 } from "lucide-react";
import {
  DropdownOptionsSettings,
  getCachedDropdownSettings,
  DEFAULT_LENDERS,
} from "@/lib/api";

export interface NewLoanFormPayload {
  lender: string;
  property: string;
  loanReference: string;
  loanAmount?: string;
  balance: string;
  purpose: string;
  repaymentType: string;
  rateType: string;
  loanType: string;
  rate: string;
  offsetBalance: string;
  isTchLoan: boolean;
  settlementDate?: string;
  ioExpiry: string;
  fixedExpiry: string;
  maturityDate: string;
  security1: string;
  security2: string;
  security3: string;
  additionalSecurities?: string[];
}

export interface LoanModalInitialData {
  id?: string;
  lender: string;
  property?: string;
  loanReferences?: string;
  loanReference?: string;
  loanAmount?: string | number;
  rawLoanAmount?: string | number;
  balance?: string | number;
  purpose?: string;
  repayment?: string;
  repaymentType?: string;
  rateType?: string;
  loanType?: string;
  rate?: string;
  interestRate?: string | number;
  offsetBalance?: string | number;
  tchLoan?: "yes" | "No" | boolean;
  isTchLoan?: boolean;
  settlementDate?: string;
  rawSettlementDate?: string;
  ioExpiry?: string;
  fixedExpiry?: string;
  maturity?: string;
  maturityDate?: string;
  security1?: string;
  security2?: string;
  security3?: string;
  additionalSecurities?: string[];
}

interface AddLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: LoanModalInitialData | null;
  onAddLoan?: (loan: NewLoanFormPayload) => Promise<void> | void;
  onUpdateLoan?: (
    loanId: string,
    loan: NewLoanFormPayload
  ) => Promise<void> | void;
  availableProperties?: string[];
}

function toIsoDate(dateStr?: string | null): string {
  if (!dateStr || dateStr === "---" || dateStr === "----" || dateStr === "-") return "";
  const trimmed = String(dateStr).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, "0");
    const month = dmyMatch[2].padStart(2, "0");
    let year = dmyMatch[3];
    if (year.length === 2) {
      year = `20${year}`;
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
    return `${parts[2]}-${parts[1]}-${parts[0].slice(2)}`;
  }
  return isoDate;
}

function DatePickerField({
  label,
  required,
  value,
  onChange,
  placeholder = "dd-mm-yyyy",
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const displayVal = value ? formatToDisplayDate(value) : "";

  return (
    <div>
      <label className="block text-[13px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
        {label} {required && <span className="text-[#8C9BA8]">*</span>}
      </label>
      <div
        className="relative w-full h-[46px] bg-white border border-[#E2E8F0] rounded-[8px] flex items-center px-3.5 cursor-pointer hover:border-[#CBD5E1] transition-colors"
        onClick={() => {
          try {
            inputRef.current?.showPicker();
          } catch {
            inputRef.current?.focus();
          }
        }}
      >
        <span
          className={`text-[13.5px] flex-1 select-none font-['Poppins',sans-serif] ${
            displayVal ? "text-[#1A1C1E]" : "text-[#BCBCBC]"
          }`}
        >
          {displayVal || placeholder}
        </span>
        <button
          type="button"
          tabIndex={-1}
          className="text-[#8C9BA8] hover:text-[#0E2841] transition-colors"
        >
          <Calendar className="w-4 h-4" />
        </button>
        <input
          ref={inputRef}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="sr-only"
          tabIndex={-1}
        />
      </div>
    </div>
  );
}

export default function AddLoanModal({
  isOpen,
  onClose,
  initialData,
  onAddLoan,
  onUpdateLoan,
  availableProperties = [],
}: AddLoanModalProps) {
  const [dropdownSettings, setDropdownSettings] =
    useState<DropdownOptionsSettings>(getCachedDropdownSettings());

  const [lender, setLender] = useState("ANZ");
  const [isTchLoan, setIsTchLoan] = useState(true);
  const [loanReference, setLoanReference] = useState("");
  const [purpose, setPurpose] = useState("Owner Occupied");
  const [repayment, setRepayment] = useState("Principal & Interest");
  const [rateType1, setRateType1] = useState("Variable");
  const [rateType2, setRateType2] = useState("5.34");
  const [loanAmount, setLoanAmount] = useState("");
  const [settlementDate, setSettlementDate] = useState("");
  const [ioExpiry, setIoExpiry] = useState("");
  const [fixedExpiry, setFixedExpiry] = useState("");
  const [maturityDate, setMaturityDate] = useState("2026-10-27");

  // Loan Allocation & Security
  const [security1, setSecurity1] = useState("");
  const [additionalSecurities, setAdditionalSecurities] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const freshSettings = getCachedDropdownSettings();
      setDropdownSettings(freshSettings);

      const lendersList =
        freshSettings.lenders && freshSettings.lenders.length > 0
          ? freshSettings.lenders
          : DEFAULT_LENDERS;

      if (initialData) {
        // Edit mode
        setLender(initialData.lender || lendersList[0] || "ANZ");
        setIsTchLoan(
          initialData.isTchLoan !== undefined
            ? Boolean(initialData.isTchLoan)
            : initialData.tchLoan === "yes" || initialData.tchLoan === true
        );
        setLoanReference(
          initialData.loanReference || initialData.loanReferences || ""
        );
        setPurpose(initialData.purpose || "Owner Occupied");
        setRepayment(
          initialData.repayment ||
            initialData.repaymentType ||
            "Principal & Interest"
        );
        setRateType1(initialData.rateType || initialData.loanType || "Variable");
        setRateType2(
          initialData.rate !== undefined
            ? String(initialData.rate).replace(/[^0-9.]/g, "")
            : initialData.interestRate !== undefined
            ? String(initialData.interestRate).replace(/[^0-9.]/g, "")
            : "5.34"
        );

        const rawAmt =
          initialData.rawLoanAmount !== undefined && initialData.rawLoanAmount !== ""
            ? String(initialData.rawLoanAmount)
            : initialData.loanAmount !== undefined
            ? String(initialData.loanAmount).replace(/[^0-9.]/g, "")
            : initialData.balance !== undefined
            ? String(initialData.balance).replace(/[^0-9.]/g, "")
            : "";
        setLoanAmount(rawAmt || "");

        const rawSett =
          initialData.settlementDate || initialData.rawSettlementDate || "";
        setSettlementDate(toIsoDate(rawSett));

        const rawIo = initialData.ioExpiry === "----" ? "" : initialData.ioExpiry || "";
        setIoExpiry(toIsoDate(rawIo));

        const rawFixed =
          initialData.fixedExpiry === "----" ? "" : initialData.fixedExpiry || "";
        setFixedExpiry(toIsoDate(rawFixed));

        const rawMaturity =
          initialData.maturityDate || initialData.maturity || "27/10/2026";
        setMaturityDate(toIsoDate(rawMaturity) || "2026-10-27");

        setSecurity1(
          initialData.security1 ||
            (availableProperties.length > 0 ? availableProperties[0] : "")
        );

        // Load additional securities
        const extras: string[] = [];
        if (
          Array.isArray(initialData.additionalSecurities) &&
          initialData.additionalSecurities.length > 0
        ) {
          extras.push(...initialData.additionalSecurities.filter(Boolean));
        } else {
          if (
            initialData.security2 &&
            initialData.security2 !== "----" &&
            initialData.security2 !== "None"
          ) {
            extras.push(initialData.security2);
          }
          if (
            initialData.security3 &&
            initialData.security3 !== "----" &&
            initialData.security3 !== "None"
          ) {
            extras.push(initialData.security3);
          }
        }
        setAdditionalSecurities(extras);
      } else {
        // Add mode
        setLender(lendersList[0] || "ANZ");
        setIsTchLoan(true);
        setLoanReference("");
        setPurpose("Owner Occupied");
        setRepayment("Principal & Interest");
        setRateType1("Variable");
        setRateType2("5.34");
        setLoanAmount("");
        setSettlementDate("");
        setIoExpiry("");
        setFixedExpiry("");
        setMaturityDate("2026-10-27");
        setSecurity1(
          availableProperties.length > 0 ? availableProperties[0] : ""
        );
        setAdditionalSecurities([]);
      }
    }
  }, [isOpen, initialData, availableProperties]);

  if (!isOpen) return null;

  const defaultSecurity =
    security1.trim() ||
    availableProperties[0] ||
    "14 Bellevue Terrace, Paddington";

  const lendersList =
    dropdownSettings.lenders && dropdownSettings.lenders.length > 0
      ? dropdownSettings.lenders
      : DEFAULT_LENDERS;

  const handleAddSecurity = () => {
    const nextProp =
      availableProperties.find(
        (p) => p !== security1 && !additionalSecurities.includes(p)
      ) ||
      availableProperties[0] ||
      "";
    setAdditionalSecurities((prev) => [...prev, nextProp]);
  };

  const handleRemoveSecurity = (index: number) => {
    setAdditionalSecurities((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateSecurity = (index: number, value: string) => {
    setAdditionalSecurities((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lender.trim() || submitting) return;

    setSubmitting(true);
    try {
      const ref =
        loanReference.trim() ||
        `${lender.trim().slice(0, 3).toUpperCase()}${Math.floor(
          100000 + Math.random() * 900000
        )}`;

      const displaySettlementDate =
        formatToDisplayDate(settlementDate) || settlementDate || "----";
      const displayIoExpiry =
        formatToDisplayDate(ioExpiry) || ioExpiry || "----";
      const displayFixedExpiry =
        formatToDisplayDate(fixedExpiry) || fixedExpiry || "----";
      const displayMaturityDate =
        formatToDisplayDate(maturityDate) || maturityDate || "27/10/2026";

      const cleanAmount = loanAmount.replace(/[^0-9.]/g, "") || "650000";

      const payload: NewLoanFormPayload = {
        lender: lender.trim(),
        property: defaultSecurity,
        loanReference: ref,
        loanAmount: cleanAmount,
        balance: cleanAmount,
        purpose: purpose.trim() || "Owner Occupied",
        repaymentType: repayment.trim() || "Principal & Interest",
        rateType: rateType1.trim() || "Variable",
        loanType: rateType1.trim() || "Variable",
        rate: rateType2.replace(/[^0-9.]/g, "") || "5.34",
        offsetBalance:
          initialData?.offsetBalance !== undefined
            ? String(initialData.offsetBalance)
            : "24000",
        isTchLoan,
        settlementDate: displaySettlementDate,
        ioExpiry: displayIoExpiry,
        fixedExpiry: displayFixedExpiry,
        maturityDate: displayMaturityDate,
        security1: defaultSecurity,
        security2: additionalSecurities[0] || "----",
        security3: additionalSecurities[1] || "----",
        additionalSecurities,
      };

      if (initialData?.id && onUpdateLoan) {
        await onUpdateLoan(initialData.id, payload);
      } else if (onAddLoan) {
        await onAddLoan(payload);
      }

      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-[588px] sm:w-[588px] max-h-[90vh] overflow-y-auto bg-white rounded-[20px] shadow-2xl p-6 sm:p-9 animate-in fade-in zoom-in-95 duration-150">
        {/* Figma Round Navy Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#183654] text-white flex items-center justify-center hover:bg-[#0E2841] transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-[22px] font-bold text-[#071E36] tracking-tight font-['Poppins',sans-serif]">
            {initialData ? "Edit Loan Facility" : "Add Loan Facility"}
          </h2>
          <p className="text-[13px] text-[#8C9BA8] font-normal mt-1 font-['Poppins',sans-serif]">
            {initialData
              ? "Update mortgage or investment loan facility details for this household."
              : "Create a new client/family profile and begin setup."}
          </p>
        </div>

        {/* Form Fields matching updated UI mockup */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Lender * (Dropdown) & TC&H Loan * (Checkbox with text) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[13px] font-medium text-[#1A1C1E] font-['Poppins',sans-serif]">
                  Lender <span className="text-[#8C9BA8]">*</span>
                </label>
                <Link
                  href="/settings?tab=dropdowns"
                  onClick={onClose}
                  className="text-[11.5px] text-[#07315B] hover:underline font-normal font-['Poppins',sans-serif]"
                >
                  Options
                </Link>
              </div>
              <div className="relative">
                <select
                  value={lender}
                  onChange={(e) => setLender(e.target.value)}
                  className="w-full h-[46px] px-3.5 pr-8 bg-white border border-[#E2E8F0] rounded-[8px] text-[13.5px] text-[#1A1C1E] focus:outline-none focus:border-[#0E2841] appearance-none cursor-pointer"
                >
                  {lendersList.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C9BA8] pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
                TC&amp;H Loan <span className="text-[#8C9BA8]">*</span>
              </label>
              <div
                onClick={() => setIsTchLoan(!isTchLoan)}
                className="w-full h-[46px] px-3.5 bg-white border border-[#E2E8F0] rounded-[8px] flex items-center gap-2.5 cursor-pointer select-none hover:border-[#CBD5E1] transition-colors"
                title="Toggle TC&H Loan"
              >
                <div
                  className={`w-[18px] h-[18px] rounded-[4px] border flex items-center justify-center transition-colors shrink-0 ${
                    isTchLoan
                      ? "bg-[#071E36] border-[#071E36] text-white"
                      : "border-[#D1D5DB] bg-white"
                  }`}
                >
                  {isTchLoan && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <span className="text-[13px] text-[#8C9BA8] font-normal font-['Poppins',sans-serif] truncate">
                  {isTchLoan ? "yes this loan written...." : "No"}
                </span>
              </div>
            </div>
          </div>

          {/* Row 2: Loan Reference * & Purpose * (Dropdown) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
                Loan Reference <span className="text-[#8C9BA8]">*</span>
              </label>
              <input
                type="text"
                value={loanReference}
                onChange={(e) => setLoanReference(e.target.value)}
                placeholder="select State"
                className="w-full h-[46px] px-3.5 bg-white border border-[#E2E8F0] rounded-[8px] text-[13.5px] text-[#1A1C1E] placeholder-[#BCBCBC] focus:outline-none focus:border-[#0E2841]"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
                Purpose <span className="text-[#8C9BA8]">*</span>
              </label>
              <div className="relative">
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full h-[46px] px-3.5 pr-8 bg-white border border-[#E2E8F0] rounded-[8px] text-[13.5px] text-[#1A1C1E] focus:outline-none focus:border-[#0E2841] appearance-none cursor-pointer"
                >
                  <option value="owner">owner</option>
                  <option value="Owner Occupied">Owner Occupied</option>
                  <option value="Investment">Investment</option>
                  <option value="Commercial">Commercial</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C9BA8] pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Row 3: Repayment * (Dropdown) & Rate Type * (Dropdown) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
                Repayment <span className="text-[#8C9BA8]">*</span>
              </label>
              <div className="relative">
                <select
                  value={repayment}
                  onChange={(e) => setRepayment(e.target.value)}
                  className="w-full h-[46px] px-3.5 pr-8 bg-white border border-[#E2E8F0] rounded-[8px] text-[13.5px] text-[#1A1C1E] focus:outline-none focus:border-[#0E2841] appearance-none cursor-pointer"
                >
                  <option value="Principal interest">Principal interest</option>
                  <option value="Principal & Interest">Principal & Interest</option>
                  <option value="Interest only">Interest only</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C9BA8] pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
                Rate Type <span className="text-[#8C9BA8]">*</span>
              </label>
              <div className="relative">
                <select
                  value={rateType1}
                  onChange={(e) => setRateType1(e.target.value)}
                  className="w-full h-[46px] px-3.5 pr-8 bg-white border border-[#E2E8F0] rounded-[8px] text-[13.5px] text-[#1A1C1E] focus:outline-none focus:border-[#0E2841] appearance-none cursor-pointer"
                >
                  <option value="owner">owner</option>
                  <option value="Variable">Variable</option>
                  <option value="Fixed">Fixed</option>
                  <option value="Split">Split</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C9BA8] pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Row 4: Loan Amount ($) * & Interest Rate (%) * */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
                Loan Amount ($) <span className="text-[#8C9BA8]">*</span>
              </label>
              <input
                type="text"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                placeholder="Variable"
                className="w-full h-[46px] px-3.5 bg-white border border-[#E2E8F0] rounded-[8px] text-[13.5px] text-[#1A1C1E] placeholder-[#BCBCBC] focus:outline-none focus:border-[#0E2841]"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
                Interest Rate (%) <span className="text-[#8C9BA8]">*</span>
              </label>
              <input
                type="text"
                value={rateType2}
                onChange={(e) => setRateType2(e.target.value)}
                placeholder="e.g 5.34"
                className="w-full h-[46px] px-3.5 bg-white border border-[#E2E8F0] rounded-[8px] text-[13.5px] text-[#1A1C1E] placeholder-[#BCBCBC] focus:outline-none focus:border-[#0E2841]"
              />
            </div>
          </div>

          {/* Row 5: Settlement Date * & IO Expiry * */}
          <div className="grid grid-cols-2 gap-4">
            <DatePickerField
              label="Settlement Date"
              required
              value={settlementDate}
              onChange={setSettlementDate}
              placeholder="dd-mm-yyyy"
            />
            <DatePickerField
              label="IO Expiry"
              required
              value={ioExpiry}
              onChange={setIoExpiry}
              placeholder="dd-mm-yyyy"
            />
          </div>

          {/* Row 6: Fixed Expiry & Maturity Date */}
          <div className="grid grid-cols-2 gap-4">
            <DatePickerField
              label="Fixed Expiry"
              value={fixedExpiry}
              onChange={setFixedExpiry}
              placeholder="dd-mm-yyyy"
            />
            <DatePickerField
              label="Maturity Date"
              value={maturityDate}
              onChange={setMaturityDate}
              placeholder="27-10-26"
            />
          </div>

          {/* Row 7: Loan Allocation & Security (Matching Screenshot) */}
          <div className="pt-2">
            <p className="text-[12.5px] font-semibold text-[#07315B] mb-2 font-['Poppins',sans-serif]">
              Loan Allocation &amp; Security
            </p>
            <div className="border border-[#E2E8F0] rounded-[12px] p-4 bg-[#FBFBFC] space-y-4">
              {/* Primary Security: Security 1 * */}
              <div>
                <label className="block text-[12.5px] font-medium text-[#1A1C1E] mb-1 font-['Poppins',sans-serif]">
                  Security 1 <span className="text-[#8C9BA8]">*</span>
                </label>
                <div className="relative">
                  {availableProperties.length > 0 ? (
                    <select
                      value={security1 || availableProperties[0]}
                      onChange={(e) => setSecurity1(e.target.value)}
                      className="w-full h-[42px] px-3 pr-8 bg-white border border-[#E2E8F0] rounded-[8px] text-[13px] text-[#1A1C1E] focus:outline-none focus:border-[#0E2841] appearance-none cursor-pointer"
                    >
                      {availableProperties.map((addr) => (
                        <option key={addr} value={addr}>
                          {addr}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={security1}
                      onChange={(e) => setSecurity1(e.target.value)}
                      placeholder="14 Bellevue Terrace, Paddington"
                      className="w-full h-[42px] px-3 pr-8 bg-white border border-[#E2E8F0] rounded-[8px] text-[13px] text-[#1A1C1E] focus:outline-none focus:border-[#0E2841]"
                    />
                  )}
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C9BA8] pointer-events-none" />
                </div>
              </div>

              {/* Dynamic Additional Securities */}
              {additionalSecurities.map((sec, idx) => (
                <div key={`extra-sec-${idx}`} className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="block text-[12.5px] font-medium text-[#1A1C1E] mb-1 font-['Poppins',sans-serif]">
                      Security {idx + 2} (Optional)
                    </label>
                    <div className="relative">
                      {availableProperties.length > 0 ? (
                        <select
                          value={sec}
                          onChange={(e) => handleUpdateSecurity(idx, e.target.value)}
                          className="w-full h-[42px] px-3 pr-8 bg-white border border-[#E2E8F0] rounded-[8px] text-[13px] text-[#1A1C1E] focus:outline-none focus:border-[#0E2841] appearance-none cursor-pointer"
                        >
                          {availableProperties.map((addr) => (
                            <option key={addr} value={addr}>
                              {addr}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={sec}
                          onChange={(e) => handleUpdateSecurity(idx, e.target.value)}
                          placeholder="Property Address"
                          className="w-full h-[42px] px-3 bg-white border border-[#E2E8F0] rounded-[8px] text-[13px] text-[#1A1C1E] focus:outline-none focus:border-[#0E2841]"
                        />
                      )}
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C9BA8] pointer-events-none" />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveSecurity(idx)}
                    className="mt-5 p-2 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                    title="Remove Security"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {/* + Add Security Button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleAddSecurity}
                  className="text-[12.5px] font-medium text-[#07315B] hover:text-[#0E2841] transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>+ Add Security</span>
                </button>
              </div>
            </div>
          </div>

          {/* Centered Add / Save Loan Button */}
          <div className="pt-3 flex justify-center">
            <button
              type="submit"
              disabled={submitting}
              className="w-[335px] max-w-full h-[52px] bg-[#0E2841] hover:bg-[#153B5E] disabled:opacity-50 text-white font-['Poppins',sans-serif] font-semibold text-[14px] leading-[100%] tracking-[0px] rounded-[8px] flex items-center justify-center transition-colors shadow-sm cursor-pointer"
            >
              {submitting
                ? initialData
                  ? "Saving Changes..."
                  : "Saving Loan..."
                : initialData
                ? "Save Changes"
                : "Add Loan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
