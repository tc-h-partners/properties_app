"use client";

import React, { useState } from "react";
import { X, ChevronDown } from "lucide-react";

interface AddEntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEntity?: (entity: {
    name: string;
    type: string;
    abn: string;
    email: string;
    phone: string;
    regDate: string;
  }) => Promise<void> | void;
}

export default function AddEntityModal({
  isOpen,
  onClose,
  onAddEntity,
}: AddEntityModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState("Individual");
  const [abn, setAbn] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [regDate, setRegDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || submitting) return;

    setSubmitting(true);
    try {
      if (onAddEntity) {
        await onAddEntity({
          name: name.trim(),
          type,
          abn: abn.trim() || "-",
          email: email.trim() || "-",
          phone: phone.trim() || "-",
          regDate: regDate.trim() || "---",
        });
      }

      setName("");
      setAbn("");
      setEmail("");
      setPhone("");
      setRegDate("");
      onClose();
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
        <div className="text-center mb-6">
          <h2 className="text-[22px] sm:text-[24px] font-bold text-[#07315B] tracking-tight mb-1.5 font-['Poppins',sans-serif]">
            Add New Entity / Client
          </h2>
          <p className="text-[14px] text-[#8C9BA8] font-medium font-['Poppins',sans-serif]">
            Starting a brand-new client or trust/corporate review record.
          </p>
        </div>

        {/* Form matching Figma 512:9895 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13.5px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
              Legal Entity Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Harrison Family Trust / Marcus Harrison"
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
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full h-[46px] px-3.5 pr-8 bg-[#F9F9F9] border border-[#DEDEDE] rounded-[10px] text-[14px] text-[#1A1C1E] focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="Individual">Individual</option>
                  <option value="Discretionary Trust">Discretionary Trust</option>
                  <option value="Unit Trust">Unit Trust</option>
                  <option value="Company">Company / Corporate</option>
                  <option value="SMSF">Self-Managed Super (SMSF)</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[13.5px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
                ABN / ACN
              </label>
              <input
                type="text"
                value={abn}
                onChange={(e) => setAbn(e.target.value)}
                placeholder="64 901 823 441"
                className="w-full h-[46px] px-3.5 bg-[#F9F9F9] border border-[#DEDEDE] rounded-[10px] text-[14px] text-[#1A1C1E] placeholder-[#BCBCBC] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13.5px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="info@entity.com.au"
                className="w-full h-[46px] px-3.5 bg-[#F9F9F9] border border-[#DEDEDE] rounded-[10px] text-[14px] text-[#1A1C1E] placeholder-[#BCBCBC] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[13.5px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
                Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0412 345 678"
                className="w-full h-[46px] px-3.5 bg-[#F9F9F9] border border-[#DEDEDE] rounded-[10px] text-[14px] text-[#1A1C1E] placeholder-[#BCBCBC] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[13.5px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
              Age / DOB / Registration Date
            </label>
            <input
              type="text"
              value={regDate}
              onChange={(e) => setRegDate(e.target.value)}
              placeholder="e.g. 34 or 12/04/2018"
              className="w-full h-[46px] px-3.5 bg-[#F9F9F9] border border-[#DEDEDE] rounded-[10px] text-[14px] text-[#1A1C1E] placeholder-[#BCBCBC] focus:outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-[48px] bg-[#0E2841] hover:bg-[#153B5E] disabled:opacity-60 text-white text-[14px] font-semibold rounded-[8px] transition-colors shadow-sm cursor-pointer"
            >
              {submitting ? "Saving..." : "Add Entity to Household"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
