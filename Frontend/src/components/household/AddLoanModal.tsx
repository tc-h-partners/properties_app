"use client";

import React, { useState } from "react";
import { X, ChevronDown, Check } from "lucide-react";

interface AddLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLoan?: (loan: {
    lender: string;
    property: string;
    loanType: string;
    rate: string;
    balance: string;
    repaymentType: string;
    offsetBalance: string;
    isTchLoan: boolean;
  }) => void;
}

export default function AddLoanModal({
  isOpen,
  onClose,
  onAddLoan,
}: AddLoanModalProps) {
  // Form fields matching Figma Frame 559:14875 exactly
  const [lender, setLender] = useState("");
  const [isTchLoan, setIsTchLoan] = useState(true);
  const [loanReference, setLoanReference] = useState("");
  const [purpose, setPurpose] = useState("");
  const [repayment, setRepayment] = useState("");
  const [rateType1, setRateType1] = useState("");
  const [rateType2, setRateType2] = useState("");
  const [ioExpiry, setIoExpiry] = useState("");
  const [fixedExpiry, setFixedExpiry] = useState("");
  const [maturityDate, setMaturityDate] = useState("");

  // Loan Allocation & Security
  const [security1, setSecurity1] = useState("14 Bellevue Terrace, Paddington");
  const [security2, setSecurity2] = useState("None");
  const [security3, setSecurity3] = useState("None");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lender.trim()) return;

    if (onAddLoan) {
      onAddLoan({
        lender: lender.trim(),
        property: security1 || "14 Bellevue Terrace, Paddington",
        loanType: rateType2 || rateType1 || "Variable",
        rate: "5.94",
        balance: "850,000",
        repaymentType: repayment || "Interest Only",
        offsetBalance: "45,000",
        isTchLoan,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-[588px] max-h-[90vh] overflow-y-auto bg-white rounded-[20px] shadow-2xl p-6 sm:p-9 animate-in fade-in zoom-in-95 duration-150">
        {/* Figma Round Navy Close Button (charm:circle-cross 1040:5701) */}
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
            Create a new client/family profile and begin setup.
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
              placeholder="Abel Summers"
              className="w-full h-[46px] px-3.5 bg-white border border-[#E2E8F0] rounded-[8px] text-[13.5px] text-[#1A1C1E] placeholder-[#BCBCBC] focus:outline-none focus:border-[#0E2841]"
            />
          </div>

          {/* TC&H Loan Checkbox Box */}
          <div>
            <label className="block text-[13px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
              TC&H Loan
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
                yes this loan written by TC&H
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
                placeholder="select State"
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
                placeholder="owner"
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
                placeholder="House"
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
                placeholder="owner"
                className="w-full h-[46px] px-3.5 bg-white border border-[#E2E8F0] rounded-[8px] text-[13.5px] text-[#1A1C1E] placeholder-[#BCBCBC] focus:outline-none focus:border-[#0E2841]"
              />
            </div>
          </div>

          {/* Rate Type & IO Expiry */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
                Rate Type
              </label>
              <input
                type="text"
                value={rateType2}
                onChange={(e) => setRateType2(e.target.value)}
                placeholder="Variable"
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
                placeholder="dd-mm-yyyy"
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
                placeholder="dd-mm-yyyy"
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
                placeholder="27-10-26"
                className="w-full h-[46px] px-3.5 bg-white border border-[#E2E8F0] rounded-[8px] text-[13.5px] text-[#1A1C1E] placeholder-[#BCBCBC] focus:outline-none focus:border-[#0E2841]"
              />
            </div>
          </div>

          {/* Loan Allocation & Security Sub-section matching Figma Frame 559:14994 */}
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
                    <input
                      type="text"
                      value={security1}
                      onChange={(e) => setSecurity1(e.target.value)}
                      placeholder="14 Bellevue Terrace, Paddington"
                      className="w-full h-[42px] px-3 pr-8 bg-white border border-[#E2E8F0] rounded-[8px] text-[13px] text-[#1A1C1E] focus:outline-none focus:border-[#0E2841]"
                    />
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
                    placeholder="None"
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
                    placeholder="None"
                    className="w-full h-[42px] px-3 pr-8 bg-white border border-[#E2E8F0] rounded-[8px] text-[13px] text-[#1A1C1E] focus:outline-none focus:border-[#0E2841]"
                  />
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C9BA8] pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Centered Add Loan Button matching Figma Buttons Frame 559:15045 (width: 335) */}
          <div className="pt-3 flex justify-center">
            <button
              type="submit"
              className="w-full max-w-[335px] h-[50px] bg-[#0E2841] hover:bg-[#183654] text-white text-[14px] font-semibold rounded-[8px] transition-colors shadow-sm cursor-pointer"
            >
              Add Loan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
