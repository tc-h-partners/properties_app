"use client";

import React, { useState } from "react";
import { X, ChevronDown, Trash2 } from "lucide-react";

interface RelatedPerson {
  id: string;
  name: string;
  percentage: string;
}

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
  // Form fields matching Figma Frame 559:14200 exactly
  const [address, setAddress] = useState("");
  const [state, setState] = useState("");
  const [postcode, setPostcode] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [purpose, setPurpose] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [valuation, setValuation] = useState("");
  const [landSize, setLandSize] = useState("");
  const [beds, setBeds] = useState("");
  const [baths, setBaths] = useState("");
  const [cars, setCars] = useState("");

  // Ownership structure
  const [owner1, setOwner1] = useState("Marcus Harrison");
  const [owner1Pct, setOwner1Pct] = useState("100%");
  const [owner2, setOwner2] = useState("None / 100% Single Owner");
  const [owner2Pct, setOwner2Pct] = useState("0%");
  const [additionalPersons, setAdditionalPersons] = useState<RelatedPerson[]>([]);

  const handleAddRelatedPerson = () => {
    setAdditionalPersons((prev) => [
      ...prev,
      {
        id: `person-${Date.now()}-${Math.random()}`,
        name: "",
        percentage: "0%",
      },
    ]);
  };

  const handleRemoveRelatedPerson = (id: string) => {
    setAdditionalPersons((prev) => prev.filter((p) => p.id !== id));
  };

  const handleUpdateRelatedPerson = (
    id: string,
    field: "name" | "percentage",
    value: string
  ) => {
    setAdditionalPersons((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;

    if (onAddProperty) {
      onAddProperty({
        address: address.trim(),
        state: state || "NSW",
        postcode: postcode || "2021",
        type: propertyType || "House",
        purpose: purpose || "Investment",
        purchasePrice: purchasePrice || "$800,000",
        currentValue: valuation || "$1,450,000",
        rentWeekly: "850",
        entity: owner1,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-[588px] max-h-[90vh] overflow-y-auto bg-white rounded-[20px] shadow-2xl p-6 sm:p-9 animate-in fade-in zoom-in-95 duration-150">
        {/* Figma Round Navy Close Button (charm:circle-cross 1040:5693) */}
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
            Add Property
          </h2>
          <p className="text-[13px] text-[#8C9BA8] font-normal mt-1 font-['Poppins',sans-serif]">
            Create a new client/family profile and begin setup.
          </p>
        </div>

        {/* Form Fields matching Figma 559:14200 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Street Address */}
          <div>
            <label className="block text-[13px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
              Full Street Address
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Abel Summers"
              className="w-full h-[46px] px-3.5 bg-white border border-[#E2E8F0] rounded-[8px] text-[13.5px] text-[#1A1C1E] placeholder-[#BCBCBC] focus:outline-none focus:border-[#0E2841]"
            />
          </div>

          {/* state & Post Code * */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
                state
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="select State"
                  className="w-full h-[46px] px-3.5 pr-8 bg-white border border-[#E2E8F0] rounded-[8px] text-[13.5px] text-[#1A1C1E] placeholder-[#BCBCBC] focus:outline-none focus:border-[#0E2841]"
                />
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C9BA8] pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
                Post Code <span className="text-[#8C9BA8]">*</span>
              </label>
              <input
                type="text"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                placeholder="Select postcode"
                className="w-full h-[46px] px-3.5 bg-white border border-[#E2E8F0] rounded-[8px] text-[13.5px] text-[#1A1C1E] placeholder-[#BCBCBC] focus:outline-none focus:border-[#0E2841]"
              />
            </div>
          </div>

          {/* Type & Purpose * */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
                Type
              </label>
              <input
                type="text"
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                placeholder="House"
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

          {/* Purchase Date & Purchase Price ($) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
                Purchase Date
              </label>
              <input
                type="text"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                placeholder="27-10-26"
                className="w-full h-[46px] px-3.5 bg-white border border-[#E2E8F0] rounded-[8px] text-[13.5px] text-[#1A1C1E] placeholder-[#BCBCBC] focus:outline-none focus:border-[#0E2841]"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
                Purchase Price ($)
              </label>
              <input
                type="text"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="64 901 823 441"
                className="w-full h-[46px] px-3.5 bg-white border border-[#E2E8F0] rounded-[8px] text-[13.5px] text-[#1A1C1E] placeholder-[#BCBCBC] focus:outline-none focus:border-[#0E2841]"
              />
            </div>
          </div>

          {/* Review Date Valuation ($) & Land size */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
                Review Date Valuation ($)
              </label>
              <input
                type="text"
                value={valuation}
                onChange={(e) => setValuation(e.target.value)}
                placeholder="1450000"
                className="w-full h-[46px] px-3.5 bg-white border border-[#E2E8F0] rounded-[8px] text-[13.5px] text-[#1A1C1E] placeholder-[#BCBCBC] focus:outline-none focus:border-[#0E2841]"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
                Land size
              </label>
              <input
                type="text"
                value={landSize}
                onChange={(e) => setLandSize(e.target.value)}
                placeholder="600sqm"
                className="w-full h-[46px] px-3.5 bg-white border border-[#E2E8F0] rounded-[8px] text-[13.5px] text-[#1A1C1E] placeholder-[#BCBCBC] focus:outline-none focus:border-[#0E2841]"
              />
            </div>
          </div>

          {/* Beds & Baths */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
                Beds
              </label>
              <input
                type="text"
                value={beds}
                onChange={(e) => setBeds(e.target.value)}
                placeholder="3"
                className="w-full h-[46px] px-3.5 bg-white border border-[#E2E8F0] rounded-[8px] text-[13.5px] text-[#1A1C1E] placeholder-[#BCBCBC] focus:outline-none focus:border-[#0E2841]"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
                Baths
              </label>
              <input
                type="text"
                value={baths}
                onChange={(e) => setBaths(e.target.value)}
                placeholder="5"
                className="w-full h-[46px] px-3.5 bg-white border border-[#E2E8F0] rounded-[8px] text-[13.5px] text-[#1A1C1E] placeholder-[#BCBCBC] focus:outline-none focus:border-[#0E2841]"
              />
            </div>
          </div>

          {/* Cars */}
          <div>
            <label className="block text-[13px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
              Cars
            </label>
            <input
              type="text"
              value={cars}
              onChange={(e) => setCars(e.target.value)}
              placeholder="2"
              className="w-full h-[46px] px-3.5 bg-white border border-[#E2E8F0] rounded-[8px] text-[13.5px] text-[#1A1C1E] placeholder-[#BCBCBC] focus:outline-none focus:border-[#0E2841]"
            />
          </div>

          {/* Title Ownership Structure Sub-section matching Figma Frame 559:14818 */}
          <div className="pt-2">
            <p className="text-[12px] font-normal text-[#8C9BA8] mb-2 font-['Poppins',sans-serif]">
              Title Ownership Structure
            </p>
            <div className="border border-[#E2E8F0] rounded-[12px] p-4 bg-[#FBFBFC] space-y-4">
              {/* Row 1: Owner 1 * & Ownership % */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12.5px] font-medium text-[#1A1C1E] mb-1 font-['Poppins',sans-serif]">
                    Owner 1 <span className="text-[#8C9BA8]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={owner1}
                      onChange={(e) => setOwner1(e.target.value)}
                      placeholder="Marcus Harrison"
                      className="w-full h-[42px] px-3 pr-8 bg-white border border-[#E2E8F0] rounded-[8px] text-[13px] text-[#1A1C1E] focus:outline-none focus:border-[#0E2841]"
                    />
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C9BA8] pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-[12.5px] font-medium text-[#1A1C1E] mb-1 font-['Poppins',sans-serif]">
                    Ownership %
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={owner1Pct}
                      onChange={(e) => setOwner1Pct(e.target.value)}
                      placeholder="100%"
                      className="w-full h-[42px] px-3 pr-8 bg-white border border-[#E2E8F0] rounded-[8px] text-[13px] text-[#1A1C1E] focus:outline-none focus:border-[#0E2841]"
                    />
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C9BA8] pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Row 2: Owner 2 (Optional) & Ownership % */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12.5px] font-medium text-[#1A1C1E] mb-1 font-['Poppins',sans-serif]">
                    Owner 2 (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={owner2}
                      onChange={(e) => setOwner2(e.target.value)}
                      placeholder="None / 100% Single Owner"
                      className="w-full h-[42px] px-3 pr-8 bg-white border border-[#E2E8F0] rounded-[8px] text-[13px] text-[#1A1C1E] focus:outline-none focus:border-[#0E2841]"
                    />
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C9BA8] pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-[12.5px] font-medium text-[#1A1C1E] mb-1 font-['Poppins',sans-serif]">
                    Ownership %
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={owner2Pct}
                      onChange={(e) => setOwner2Pct(e.target.value)}
                      placeholder="0%"
                      className="w-full h-[42px] px-3 pr-8 bg-white border border-[#E2E8F0] rounded-[8px] text-[13px] text-[#1A1C1E] focus:outline-none focus:border-[#0E2841]"
                    />
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C9BA8] pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Dynamic Additional Related Persons */}
              {additionalPersons.map((person, index) => (
                <div key={person.id} className="grid grid-cols-2 gap-4 items-end relative pt-2 border-t border-[#F0F1F3]">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[12.5px] font-medium text-[#1A1C1E] font-['Poppins',sans-serif]">
                        Owner {index + 3} (Optional)
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRemoveRelatedPerson(person.id)}
                        className="text-xs text-red-500 hover:text-red-700 cursor-pointer flex items-center gap-0.5"
                        title="Remove related person"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={person.name}
                        onChange={(e) =>
                          handleUpdateRelatedPerson(person.id, "name", e.target.value)
                        }
                        placeholder="e.g. Sarah Harrison / Family Trust"
                        className="w-full h-[42px] px-3 pr-8 bg-white border border-[#E2E8F0] rounded-[8px] text-[13px] text-[#1A1C1E] focus:outline-none focus:border-[#0E2841]"
                      />
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C9BA8] pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12.5px] font-medium text-[#1A1C1E] mb-1 font-['Poppins',sans-serif]">
                      Ownership %
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={person.percentage}
                        onChange={(e) =>
                          handleUpdateRelatedPerson(person.id, "percentage", e.target.value)
                        }
                        placeholder="0%"
                        className="w-full h-[42px] px-3 pr-8 bg-white border border-[#E2E8F0] rounded-[8px] text-[13px] text-[#1A1C1E] focus:outline-none focus:border-[#0E2841]"
                      />
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C9BA8] pointer-events-none" />
                    </div>
                  </div>
                </div>
              ))}

              {/* + Add Another Related Person */}
              <div>
                <button
                  type="button"
                  onClick={handleAddRelatedPerson}
                  className="text-[12.5px] font-medium text-[#071E36] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>+ Add Another Related Person</span>
                </button>
              </div>
            </div>
          </div>

          {/* Centered Add Property Button matching Figma Buttons Frame 559:14869 (width: 335) */}
          <div className="pt-3 flex justify-center">
            <button
              type="submit"
              className="w-full max-w-[335px] h-[50px] bg-[#0E2841] hover:bg-[#183654] text-white text-[14px] font-semibold rounded-[8px] transition-colors shadow-sm cursor-pointer"
            >
              Add Property
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
