"use client";

import React, { useState } from "react";
import { X, ChevronDown } from "lucide-react";

interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProperty?: (property: {
    address: string;
    state: string;
    postcode: string;
    type: string;
    purpose: string;
    purchasePrice: string;
    currentValue: string;
    rentWeekly: string;
    entity: string;
  }) => void;
}

export default function AddPropertyModal({
  isOpen,
  onClose,
  onAddProperty,
}: AddPropertyModalProps) {
  const [address, setAddress] = useState("");
  const [state, setState] = useState("NSW");
  const [postcode, setPostcode] = useState("");
  const [type, setType] = useState("House");
  const [purpose, setPurpose] = useState("Investment");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [rentWeekly, setRentWeekly] = useState("");
  const [entity, setEntity] = useState("Individual");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;

    if (onAddProperty) {
      onAddProperty({
        address,
        state,
        postcode,
        type,
        purpose,
        purchasePrice,
        currentValue,
        rentWeekly,
        entity,
      });
    }

    setAddress("");
    setPostcode("");
    setPurchasePrice("");
    setCurrentValue("");
    setRentWeekly("");
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
            Add Property
          </h2>
          <p className="text-[14px] text-[#8C9BA8] font-medium font-['Poppins',sans-serif]">
            Record real estate asset details and ownership structures.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13.5px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
              Full Street Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 14 Bellevue Terrace, Paddington"
              className="w-full h-[46px] px-3.5 bg-[#F9F9F9] border border-[#DEDEDE] rounded-[10px] text-[14px] text-[#1A1C1E] placeholder-[#BCBCBC] focus:outline-none focus:ring-2 focus:ring-[#0E2841]/20 focus:border-[#0E2841]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13.5px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
                State
              </label>
              <div className="relative">
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full h-[46px] px-3.5 pr-8 bg-[#F9F9F9] border border-[#DEDEDE] rounded-[10px] text-[14px] text-[#1A1C1E] focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="NSW">NSW</option>
                  <option value="VIC">VIC</option>
                  <option value="QLD">QLD</option>
                  <option value="WA">WA</option>
                  <option value="SA">SA</option>
                  <option value="TAS">TAS</option>
                  <option value="ACT">ACT</option>
                  <option value="NT">NT</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[13.5px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
                Postcode <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                placeholder="2021"
                className="w-full h-[46px] px-3.5 bg-[#F9F9F9] border border-[#DEDEDE] rounded-[10px] text-[14px] text-[#1A1C1E] placeholder-[#BCBCBC] focus:outline-none focus:ring-2 focus:ring-[#0E2841]/20 focus:border-[#0E2841]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13.5px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
                Property Type
              </label>
              <div className="relative">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full h-[46px] px-3.5 pr-8 bg-[#F9F9F9] border border-[#DEDEDE] rounded-[10px] text-[14px] text-[#1A1C1E] focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="House">House</option>
                  <option value="Unit">Unit / Apartment</option>
                  <option value="Townhouse">Townhouse</option>
                  <option value="Commercial">Commercial</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[13.5px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
                Purpose
              </label>
              <div className="relative">
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full h-[46px] px-3.5 pr-8 bg-[#F9F9F9] border border-[#DEDEDE] rounded-[10px] text-[14px] text-[#1A1C1E] focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="Investment">Investment</option>
                  <option value="Owner Occupied">Owner Occupied</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13.5px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
                Purchase Price ($)
              </label>
              <input
                type="text"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="1,200,000"
                className="w-full h-[46px] px-3.5 bg-[#F9F9F9] border border-[#DEDEDE] rounded-[10px] text-[14px] text-[#1A1C1E] placeholder-[#BCBCBC] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[13.5px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
                Current Estimated Value ($)
              </label>
              <input
                type="text"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                placeholder="1,450,000"
                className="w-full h-[46px] px-3.5 bg-[#F9F9F9] border border-[#DEDEDE] rounded-[10px] text-[14px] text-[#1A1C1E] placeholder-[#BCBCBC] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13.5px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
                Weekly Rent ($)
              </label>
              <input
                type="text"
                value={rentWeekly}
                onChange={(e) => setRentWeekly(e.target.value)}
                placeholder="850"
                className="w-full h-[46px] px-3.5 bg-[#F9F9F9] border border-[#DEDEDE] rounded-[10px] text-[14px] text-[#1A1C1E] placeholder-[#BCBCBC] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[13.5px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
                Ownership Entity
              </label>
              <div className="relative">
                <select
                  value={entity}
                  onChange={(e) => setEntity(e.target.value)}
                  className="w-full h-[46px] px-3.5 pr-8 bg-[#F9F9F9] border border-[#DEDEDE] rounded-[10px] text-[14px] text-[#1A1C1E] focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="Individual">Individual</option>
                  <option value="Joint">Joint</option>
                  <option value="Trust">Family Trust</option>
                  <option value="Company">Company</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              className="w-full h-[48px] bg-[#0E2841] hover:bg-[#153B5E] text-white text-[14px] font-semibold rounded-[8px] transition-colors shadow-sm cursor-pointer"
            >
              Add Property to Portfolio
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
