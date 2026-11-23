"use client";

import React, { useState } from "react";
import { X, ChevronDown, Check } from "lucide-react";

export interface NewLoanFormPayload {
  lender: string;
  property: string;
  loanReference: string;
  purpose: string;
  loanType: string;
  rate: string;
  balance: string;
  repaymentType: string;
  offsetBalance: string;
  isTchLoan: boolean;
  ioExpiry: string;
  fixedExpiry: string;
  maturityDate: string;
  security1: string;
  security2: string;
  security3: string;
}

interface AddLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLoan?: (loan: NewLoanFormPayload) => Promise<void> | void;
  availableProperties?: string[];
}

export default function AddLoanModal({
  isOpen,
  onClose,
  onAddLoan,
  availableProperties = [],
}: AddLoanModalProps) {
  const [lender, setLender] = useState("");
  const [isTchLoan, setIsTchLoan] = useState(true);
  const [loanReference, setLoanReference] = useState("");
  const [purpose, setPurpose] = useState("Investment");
  const [repayment, setRepayment] = useState("Interest only");
  const [rateType1, setRateType1] = useState("Variable");
  const [rateType2, setRateType2] = useState("5.94");
  const [ioExpiry, setIoExpiry] = useState("");
  const [fixedExpiry, setFixedExpiry] = useState("");
  const [maturityDate, setMaturityDate] = useState("");

  // Loan Allocation & Security
  const [security1, setSecurity1] = useState("");
  const [security2, setSecurity2] = useState("----");
  const [security3, setSecurity3] = useState("----");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const defaultSecurity =
    security1.trim() ||
    availableProperties[0] ||
    "48 Underwood Street, Paddington NSW 2021";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lender.trim() || submitting) return;

    setSubmitting(true);
    try {
      if (onAddLoan) {
        const ref =
          loanReference.trim() ||
          `${lender.trim().slice(0, 3).toUpperCase()}${Math.floor(
            100000 + Math.random() * 900000
          )}`;
        await onAddLoan({
          lender: lender.trim(),
          property: defaultSecurity,
          loanReference: ref,
          purpose: purpose.trim() || "Investment",
          loanType: rateType1.trim() || "Variable",
          rate: rateType2.replace(/[^0-9.]/g, "") || "5.94",
          balance: "650000",
          repaymentType: repayment.trim() || "Interest only",
          offsetBalance: "24000",
          isTchLoan,
          ioExpiry: ioExpiry.trim() || "24/10/2026",
          fixedExpiry: fixedExpiry.trim() || "----",
          maturityDate: maturityDate.trim() || "24/10/2026",
          security1: defaultSecurity,
          security2:
            !security2.trim() || security2 === "None"
              ? "----"
              : security2.trim(),
          security3:
            !security3.trim() || security3 === "None"
              ? "----"
              : security3.trim(),
        });
      }

      setLender("");
      setLoanReference("");
      setIoExpiry("");
      setFixedExpiry("");
      setMaturityDate("");
      setSecurity1("");
      setSecurity2("----");
      setSecurity3("----");
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-[588px] max-h-[90vh] overflow-y-auto bg-white rounded-[20px] shadow-2xl p-6 sm:p-9 animate-in fade-in zoom-in-95 duration-150">
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
            Add Loan Facility
          </h2>
          <p className="text-[13px] text-[#8C9BA8] font-normal mt-1 font-['Poppins',sans-serif]">
            Add a new mortgage or investment loan facility to this household.
          </p>
        </div>

        {/* Form Fields matching Figma 559:14875 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Lender */}
          <div>
            <label className="block text-[13px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
              Lender
            </label>
            <input
              type="text"
              required
              value={lender}
              onChange={(e) => setLender(e.target.value)}
              placeholder="e.g. ANZ, CBA, NAB, Macquarie"
              className="w-full h-[46px] px-3.5 bg-white border border-[#E2E8F0] rounded-[8px] text-[13.5px] text-[#1A1C1E] placeholder-[#BCBCBC] focus:outline-none focus:border-[#0E2841]"
            />
          </div>

          {/* TC&H Loan Checkbox Box */}
          <div>
            <label className="block text-[13px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
              TC&amp;H Loan
            </label>
            <div
              onClick={() => setIsTchLoan(!isTchLoan)}
              className="w-full h-[46px] px-3.5 bg-white border border-[#E2E8F0] rounded-[8px] flex items-center gap-3 cursor-pointer select-none"
            >
              <div
                className={`w-[18px] h-[18px] rounded-[4px] border flex items-center justify-center transition-colors ${
                  isTchLoan
                    ? "bg-[#071E36] border-[#071E36] text-white"
                    : "border-[#D1D5DB] bg-white"
                }`}
              >
                {isTchLoan && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
              <span className="text-[13px] text-[#8C9BA8] font-normal font-['Poppins',sans-serif]">
                yes this loan written by TC&amp;H
              </span>
            </div>
          </div>

          {/* Loan Reference & Purpose * */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
                Loan Reference
              </label>
              <input
                type="text"
                value={loanReference}
                onChange={(e) => setLoanReference(e.target.value)}
                placeholder="e.g. ANZ1477642"
                className="w-full h-[46px] px-3.5 bg-white border border-[#E2E8F0] rounded-[8px] text-[13.5px] text-[#1A1C1E] placeholder-[#BCBCBC] focus:outline-none focus:border-[#0E2841]"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
                Purpose <span className="text-[#8C9BA8]">*</span>
              </label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Investment or Home Loan"
                className="w-full h-[46px] px-3.5 bg-white border border-[#E2E8F0] rounded-[8px] text-[13.5px] text-[#1A1C1E] placeholder-[#BCBCBC] focus:outline-none focus:border-[#0E2841]"
              />
            </div>
          </div>

          {/* Repayment & Rate Type * */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
                Repayment
              </label>
              <input
                type="text"
                value={repayment}
                onChange={(e) => setRepayment(e.target.value)}
                placeholder="Interest only or Principal & Interest"
                className="w-full h-[46px] px-3.5 bg-white border border-[#E2E8F0] rounded-[8px] text-[13.5px] text-[#1A1C1E] placeholder-[#BCBCBC] focus:outline-none focus:border-[#0E2841]"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
                Rate Type <span className="text-[#8C9BA8]">*</span>
              </label>
              <input
                type="text"
                value={rateType1}
                onChange={(e) => setRateType1(e.target.value)}
                placeholder="Variable or Fixed"
                className="w-full h-[46px] px-3.5 bg-white border border-[#E2E8F0] rounded-[8px] text-[13.5px] text-[#1A1C1E] placeholder-[#BCBCBC] focus:outline-none focus:border-[#0E2841]"
              />
            </div>
          </div>

          {/* Interest Rate (%) & IO Expiry */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
                Interest Rate (%)
              </label>
              <input
                type="text"
                value={rateType2}
                onChange={(e) => setRateType2(e.target.value)}
                placeholder="5.94%"
                className="w-full h-[46px] px-3.5 bg-white border border-[#E2E8F0] rounded-[8px] text-[13.5px] text-[#1A1C1E] placeholder-[#BCBCBC] focus:outline-none focus:border-[#0E2841]"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
                IO Expiry
              </label>
              <input
                type="text"
                value={ioExpiry}
                onChange={(e) => setIoExpiry(e.target.value)}
                placeholder="24/10/2026"
                className="w-full h-[46px] px-3.5 bg-white border border-[#E2E8F0] rounded-[8px] text-[13.5px] text-[#1A1C1E] placeholder-[#BCBCBC] focus:outline-none focus:border-[#0E2841]"
              />
            </div>
          </div>

          {/* Fixed Expiry & Maturity Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
                Fixed Expiry
              </label>
              <input
                type="text"
                value={fixedExpiry}
                onChange={(e) => setFixedExpiry(e.target.value)}
                placeholder="----"
                className="w-full h-[46px] px-3.5 bg-white border border-[#E2E8F0] rounded-[8px] text-[13.5px] text-[#1A1C1E] placeholder-[#BCBCBC] focus:outline-none focus:border-[#0E2841]"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
                Maturity Date
              </label>
              <input
                type="text"
                value={maturityDate}
                onChange={(e) => setMaturityDate(e.target.value)}
                placeholder="24/10/2026"
                className="w-full h-[46px] px-3.5 bg-white border border-[#E2E8F0] rounded-[8px] text-[13.5px] text-[#1A1C1E] placeholder-[#BCBCBC] focus:outline-none focus:border-[#0E2841]"
              />
            </div>
          </div>

          {/* Loan Allocation & Security Sub-section */}
          <div className="pt-2">
            <p className="text-[12px] font-normal text-[#8C9BA8] mb-2 font-['Poppins',sans-serif]">
              Loan Allocation &amp; Security
            </p>
            <div className="border border-[#E2E8F0] rounded-[12px] p-4 bg-[#FBFBFC] space-y-4">
              {/* Row 1: Security 1 * & Security 2 (Optional) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12.5px] font-medium text-[#1A1C1E] mb-1 font-['Poppins',sans-serif]">
                    Security 1 <span className="text-[#8C9BA8]">*</span>
                  </label>
                  <div className="relative">
                    {availableProperties.length > 0 ? (
                      <select
                        value={security1 || availableProperties[0]}
                        onChange={(e) => setSecurity1(e.target.value)}
                        className="w-full h-[42px] px-3 pr-8 bg-white border border-[#E2E8F0] rounded-[8px] text-[13px] text-[#1A1C1E] focus:outline-none focus:border-[#0E2841] appearance-none"
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
                        placeholder="Property Address"
                        className="w-full h-[42px] px-3 pr-8 bg-white border border-[#E2E8F0] rounded-[8px] text-[13px] text-[#1A1C1E] focus:outline-none focus:border-[#0E2841]"
                      />
                    )}
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C9BA8] pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-[12.5px] font-medium text-[#1A1C1E] mb-1 font-['Poppins',sans-serif]">
                    Security 2 (Optional)
                  </label>
                  <input
                    type="text"
                    value={security2}
                    onChange={(e) => setSecurity2(e.target.value)}
                    placeholder="----"
                    className="w-full h-[42px] px-3 bg-white border border-[#E2E8F0] rounded-[8px] text-[13px] text-[#1A1C1E] focus:outline-none focus:border-[#0E2841]"
                  />
                </div>
              </div>

              {/* Row 2: Security 3 (Optional) */}
              <div>
                <label className="block text-[12.5px] font-medium text-[#1A1C1E] mb-1 font-['Poppins',sans-serif]">
                  Security 3 (Optional)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={security3}
                    onChange={(e) => setSecurity3(e.target.value)}
                    placeholder="----"
                    className="w-full h-[42px] px-3 pr-8 bg-white border border-[#E2E8F0] rounded-[8px] text-[13px] text-[#1A1C1E] focus:outline-none focus:border-[#0E2841]"
                  />
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C9BA8] pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Centered Add Loan Button */}
          <div className="pt-3 flex justify-center">
            <button
              type="submit"
              disabled={submitting}
              className="w-full max-w-[335px] h-[50px] bg-[#0E2841] hover:bg-[#183654] disabled:opacity-60 text-white text-[14px] font-semibold rounded-[8px] transition-colors shadow-sm cursor-pointer"
            >
              {submitting ? "Saving Loan..." : "Add Loan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
