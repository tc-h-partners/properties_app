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
  const [lender, setLender] = useState("Commonwealth Bank (CBA)");
  const [property, setProperty] = useState("14 Bellevue Terrace, Paddington");
  const [loanType, setLoanType] = useState("Variable");
  const [rate, setRate] = useState("5.94");
  const [balance, setBalance] = useState("850,000");
  const [repaymentType, setRepaymentType] = useState("Principal & Interest");
  const [offsetBalance, setOffsetBalance] = useState("45,000");
  const [isTchLoan, setIsTchLoan] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onAddLoan) {
      onAddLoan({
        lender,
        property,
        loanType,
        rate,
        balance,
        repaymentType,
        offsetBalance,
        isTchLoan,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-[588px] max-h-[90vh] overflow-y-auto bg-white rounded-[16px] shadow-2xl border border-[#E9E9E9] p-6 sm:p-9 animate-in fade-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-[22px] sm:text-[24px] font-bold text-[#0E2841] tracking-tight mb-1.5 font-['Poppins',sans-serif]">
            Add Loan Facility
          </h2>
          <p className="text-[14px] text-[#8C9BA8] font-medium font-['Poppins',sans-serif]">
            Add mortgage or credit facility details for debt structuring.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13.5px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
              Lender Institution
            </label>
            <div className="relative">
              <select
                value={lender}
                onChange={(e) => setLender(e.target.value)}
                className="w-full h-[46px] px-3.5 pr-8 bg-[#F9F9F9] border border-[#DEDEDE] rounded-[10px] text-[14px] text-[#1A1C1E] focus:outline-none appearance-none cursor-pointer"
              >
                <option value="Commonwealth Bank (CBA)">Commonwealth Bank (CBA)</option>
                <option value="Westpac (WBC)">Westpac (WBC)</option>
                <option value="ANZ Bank">ANZ Bank</option>
                <option value="National Australia Bank (NAB)">National Australia Bank (NAB)</option>
                <option value="Macquarie Bank">Macquarie Bank</option>
                <option value="ING Bank">ING Bank</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-[13.5px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
              Secured Property
            </label>
            <div className="relative">
              <select
                value={property}
                onChange={(e) => setProperty(e.target.value)}
                className="w-full h-[46px] px-3.5 pr-8 bg-[#F9F9F9] border border-[#DEDEDE] rounded-[10px] text-[14px] text-[#1A1C1E] focus:outline-none appearance-none cursor-pointer"
              >
                <option value="14 Bellevue Terrace, Paddington">14 Bellevue Terrace, Paddington</option>
                <option value="7 Waratah Street, Mona Vale">7 Waratah Street, Mona Vale</option>
                <option value="22 Crown Street, Surry Hills">22 Crown Street, Surry Hills</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* TC&H Loan Toggle */}
          <div
            onClick={() => setIsTchLoan(!isTchLoan)}
            className="flex items-center gap-3 p-3 bg-[#F9F9F9] border border-[#DEDEDE] rounded-[10px] cursor-pointer"
          >
            <div
              className={`w-5 h-5 rounded-[4px] border flex items-center justify-center transition-colors ${
                isTchLoan
                  ? "bg-[#0E2841] border-[#0E2841] text-white"
                  : "border-gray-300 bg-white"
              }`}
            >
              {isTchLoan && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
            </div>
            <span className="text-[13.5px] font-medium text-[#1A1C1E]">
              Yes, this loan was originated / managed by TC&H
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13.5px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
                Loan Type
              </label>
              <div className="relative">
                <select
                  value={loanType}
                  onChange={(e) => setLoanType(e.target.value)}
                  className="w-full h-[46px] px-3.5 pr-8 bg-[#F9F9F9] border border-[#DEDEDE] rounded-[10px] text-[14px] text-[#1A1C1E] focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="Variable">Variable</option>
                  <option value="Fixed">Fixed Rate</option>
                  <option value="Split">Split Facility</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[13.5px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
                Interest Rate (% p.a.)
              </label>
              <input
                type="text"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="5.94"
                className="w-full h-[46px] px-3.5 bg-[#F9F9F9] border border-[#DEDEDE] rounded-[10px] text-[14px] text-[#1A1C1E] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13.5px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
                Loan Balance ($)
              </label>
              <input
                type="text"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="850,000"
                className="w-full h-[46px] px-3.5 bg-[#F9F9F9] border border-[#DEDEDE] rounded-[10px] text-[14px] text-[#1A1C1E] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[13.5px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
                Offset Balance ($)
              </label>
              <input
                type="text"
                value={offsetBalance}
                onChange={(e) => setOffsetBalance(e.target.value)}
                placeholder="45,000"
                className="w-full h-[46px] px-3.5 bg-[#F9F9F9] border border-[#DEDEDE] rounded-[10px] text-[14px] text-[#1A1C1E] focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              className="w-full h-[48px] bg-[#0E2841] hover:bg-[#153B5E] text-white text-[14px] font-semibold rounded-[8px] transition-colors shadow-sm cursor-pointer"
            >
              Add Loan Facility
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
