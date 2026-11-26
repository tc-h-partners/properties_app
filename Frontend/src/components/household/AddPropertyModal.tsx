"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { X, ChevronDown, Trash2, AlertCircle, Calendar } from "lucide-react";
import {
  DropdownOptionsSettings,
  getCachedDropdownSettings,
} from "@/lib/api";

export interface RelatedPerson {
  id: string;
  name: string;
  percentage: string;
}

export interface NewPropertyFormPayload {
  address: string;
  state: string;
  postcode: string;
  type: string;
  purpose: string;
  purchaseDate: string;
  purchasePrice: string;
  purchaseCosts: string;
  currentValue?: string;
  livingArea: string;
  rentWeekly: string;
  landSize: string;
  beds: number;
  baths: number;
  cars: number;
  owner1: string;
  owner1Pct: string;
  owner2: string;
  owner2Pct: string;
  entity: string;
  additionalPersons?: RelatedPerson[];
}

export interface AvailableEntityItem {
  id: string;
  name: string;
  type?: string;
}

export interface PropertyModalInitialData {
  id?: string;
  address: string;
  state?: string;
  postcode?: string;
  type?: string;
  purpose?: string;
  purchaseDate?: string;
  purchasePrice?: string | number;
  rawPurchasePrice?: string | number;
  purchaseCost?: string | number;
  purchaseCosts?: string | number;
  rawPurchaseCost?: string | number;
  livingArea?: string;
  rawLivingArea?: string;
  landSize?: string;
  size?: string;
  beds?: number;
  baths?: number;
  cars?: number;
  owner1?: string;
  owner1Pct?: string;
  owner2?: string;
  owner2Pct?: string;
  additionalPersons?: RelatedPerson[];
}

interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: PropertyModalInitialData | null;
  onAddProperty?: (property: NewPropertyFormPayload) => Promise<void> | void;
  onUpdateProperty?: (
    propertyId: string,
    property: NewPropertyFormPayload
  ) => Promise<void> | void;
  availableEntities?: AvailableEntityItem[];
}

function toIsoDate(dateStr?: string | null): string {
  if (!dateStr || dateStr === "---" || dateStr === "-") return "";
  const trimmed = String(dateStr).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, "0");
    const month = dmyMatch[2].padStart(2, "0");
    const year = dmyMatch[3];
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

function cleanStreetAddress(addr?: string, state?: string, postcode?: string): string {
  if (!addr) return "";
  let res = addr.trim();
  if (state && postcode) {
    const pattern = new RegExp(`,\\s*${state}\\s+${postcode}\\s*$`, "i");
    res = res.replace(pattern, "");
  }
  return res.trim();
}

export default function AddPropertyModal({
  isOpen,
  onClose,
  initialData,
  onAddProperty,
  onUpdateProperty,
  availableEntities = [],
}: AddPropertyModalProps) {
  const [dropdownSettings, setDropdownSettings] =
    useState<DropdownOptionsSettings>(getCachedDropdownSettings());

  const dateInputRef = useRef<HTMLInputElement>(null);

  const [address, setAddress] = useState("");
  const [state, setState] = useState("VIC");
  const [postcode, setPostcode] = useState("3039");
  const [propertyType, setPropertyType] = useState("House");
  const [purpose, setPurpose] = useState("Investment");
  const [purchaseDate, setPurchaseDate] = useState("2026-10-24");
  const [purchasePrice, setPurchasePrice] = useState("800000");
  const [purchaseCosts, setPurchaseCosts] = useState("45936");
  const [livingArea, setLivingArea] = useState("");
  const [landSize, setLandSize] = useState("600");
  const [beds, setBeds] = useState("3");
  const [baths, setBaths] = useState("2");
  const [cars, setCars] = useState("2");

  // Ownership structure
  const [owner1, setOwner1] = useState("");
  const [owner1Pct, setOwner1Pct] = useState("100%");
  const [owner2, setOwner2] = useState("");
  const [owner2Pct, setOwner2Pct] = useState("0%");
  const [additionalPersons, setAdditionalPersons] = useState<RelatedPerson[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (isOpen) {
      const freshSettings = getCachedDropdownSettings();
      setDropdownSettings(freshSettings);

      if (initialData) {
        // Edit mode: prefill existing property details
        setAddress(cleanStreetAddress(initialData.address, initialData.state, initialData.postcode));
        setState(initialData.state || freshSettings.states[0] || "VIC");
        setPostcode(initialData.postcode || "3039");
        setPropertyType(initialData.type || freshSettings.propertyTypes[0] || "House");
        setPurpose(initialData.purpose || freshSettings.propertyPurposes[0] || "Investment");

        const iso = toIsoDate(initialData.purchaseDate);
        setPurchaseDate(iso || "2026-10-24");

        const rawPrice =
          initialData.rawPurchasePrice !== undefined && initialData.rawPurchasePrice !== ""
            ? String(initialData.rawPurchasePrice)
            : String(initialData.purchasePrice || "").replace(/[^0-9.]/g, "");
        setPurchasePrice(rawPrice || "800000");

        const rawCost =
          initialData.rawPurchaseCost !== undefined && initialData.rawPurchaseCost !== ""
            ? String(initialData.rawPurchaseCost)
            : initialData.purchaseCosts !== undefined
            ? String(initialData.purchaseCosts).replace(/[^0-9.]/g, "")
            : String(initialData.purchaseCost || "").replace(/[^0-9.]/g, "");
        setPurchaseCosts(rawCost || "45936");

        const rawLiving =
          initialData.rawLivingArea !== undefined && initialData.rawLivingArea !== ""
            ? String(initialData.rawLivingArea)
            : initialData.livingArea !== "-" && initialData.livingArea
            ? String(initialData.livingArea)
            : "";
        setLivingArea(rawLiving);

        setLandSize(initialData.landSize || initialData.size || "600");
        setBeds(String(initialData.beds ?? 3));
        setBaths(String(initialData.baths ?? 2));
        setCars(String(initialData.cars ?? 2));

        setOwner1(
          initialData.owner1 ||
            (availableEntities.length > 0 ? availableEntities[0].name : "Primary Owner")
        );
        setOwner1Pct(initialData.owner1Pct || "100%");
        setOwner2(initialData.owner2 === "----" ? "" : initialData.owner2 || "");
        setOwner2Pct(initialData.owner2Pct === "---" ? "0%" : initialData.owner2Pct || "0%");
        setAdditionalPersons(initialData.additionalPersons || []);
        setValidationError("");
      } else {
        // Add mode: default values
        setAddress("");
        setState(freshSettings.states[0] || "VIC");
        setPostcode("3039");
        setPropertyType(freshSettings.propertyTypes[0] || "House");
        setPurpose(freshSettings.propertyPurposes[0] || "Investment");
        setPurchaseDate("2026-10-24");
        setPurchasePrice("800000");
        setPurchaseCosts("45936");
        setLivingArea("");
        setLandSize("600");
        setBeds("3");
        setBaths("2");
        setCars("2");

        if (availableEntities && availableEntities.length > 0) {
          setOwner1(availableEntities[0].name);
        } else {
          setOwner1("");
        }
        setOwner1Pct("100%");
        setOwner2("");
        setOwner2Pct("0%");
        setAdditionalPersons([]);
        setValidationError("");
      }
    }
  }, [isOpen, initialData, availableEntities]);

  if (!isOpen) return null;

  // Percentage helper
  const parsePct = (val: string): number => {
    const clean = String(val).replace(/[^0-9.]/g, "");
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  const numOwner1 = parsePct(owner1Pct);
  const numOwner2 =
    owner2 && !owner2.includes("None") ? parsePct(owner2Pct) : 0;
  const numAdditional = additionalPersons.reduce(
    (sum, p) => sum + parsePct(p.percentage),
    0
  );
  const totalOwnership = numOwner1 + numOwner2 + numAdditional;
  const isOwnershipExceeded = totalOwnership > 100;

  const handleAddRelatedPerson = () => {
    const remaining = Math.max(0, 100 - totalOwnership);
    const defaultName =
      availableEntities.length > 2
        ? availableEntities[2].name
        : availableEntities.length > 0
        ? availableEntities[0].name
        : "";
    setAdditionalPersons((prev) => [
      ...prev,
      {
        id: `person-${Date.now()}-${Math.random()}`,
        name: defaultName,
        percentage: `${remaining}%`,
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
    if (field === "percentage") {
      const num = parsePct(value);
      if (num > 100) value = "100%";
    }
    setAdditionalPersons((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleOwner1PctChange = (val: string) => {
    const num = parsePct(val);
    if (num > 100) val = "100%";
    setOwner1Pct(val);
  };

  const handleOwner2PctChange = (val: string) => {
    const num = parsePct(val);
    if (num > 100) val = "100%";
    setOwner2Pct(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim() || submitting) return;

    if (totalOwnership > 100) {
      setValidationError(
        `Total ownership cannot exceed 100% (currently ${totalOwnership}%)`
      );
      return;
    }

    setSubmitting(true);
    setValidationError("");
    try {
      const cleanOwner2 =
        !owner2.trim() || owner2.includes("None") ? "----" : owner2.trim();
      const cleanOwner2Pct =
        cleanOwner2 === "----" ? "---" : owner2Pct.trim() || "0%";

      const formattedDate =
        formatToDisplayDate(purchaseDate) ||
        purchaseDate.trim() ||
        new Date().toLocaleDateString("en-GB");

      const payload: NewPropertyFormPayload = {
        address: address.trim(),
        state: state.trim() || "VIC",
        postcode: postcode.trim() || "3039",
        type: propertyType.trim() || "House",
        purpose: purpose.trim() || "Investment",
        purchaseDate: formattedDate,
        purchasePrice: purchasePrice.trim() || "800000",
        purchaseCosts: purchaseCosts.trim() || "45936",
        currentValue: purchasePrice.trim() || "800000",
        livingArea: livingArea.trim(),
        rentWeekly: "850",
        landSize: landSize.trim() || "600",
        beds: parseInt(beds, 10) || 3,
        baths: parseInt(baths, 10) || 2,
        cars: parseInt(cars, 10) || 2,
        owner1: owner1.trim() || "Primary Owner",
        owner1Pct: owner1Pct.trim() || "100%",
        owner2: cleanOwner2,
        owner2Pct: cleanOwner2Pct,
        entity: owner1.trim() || "Primary Owner",
        additionalPersons,
      };

      if (initialData?.id && onUpdateProperty) {
        await onUpdateProperty(initialData.id, payload);
      } else if (onAddProperty) {
        await onAddProperty(payload);
      }

      setAddress("");
      setLivingArea("");
      setAdditionalPersons([]);
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
            {initialData ? "Edit Property" : "Add Property"}
          </h2>
          <p className="text-[13px] text-[#8C9BA8] font-normal mt-1 font-['Poppins',sans-serif]">
            {initialData
              ? "Update residential or investment property details for this household."
              : "Add a new residential or investment property to this household."}
          </p>
        </div>

        {/* Form Fields */}
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
              placeholder="17 Learmonth Street Moonee Ponds"
              className="w-full h-[46px] px-3.5 bg-white border border-[#E2E8F0] rounded-[8px] text-[13.5px] text-[#1A1C1E] placeholder-[#BCBCBC] focus:outline-none focus:border-[#0E2841]"
            />
          </div>

          {/* state & Post Code * */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[13px] font-medium text-[#1A1C1E] font-['Poppins',sans-serif]">
                  state
                </label>
                <Link
                  href="/settings?tab=dropdowns"
                  onClick={onClose}
                  className="text-[11.5px] text-[#07315B] hover:underline font-normal font-['Poppins',sans-serif]"
                >
                  Manage in Settings
                </Link>
              </div>
              <div className="relative">
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full h-[46px] px-3.5 pr-8 bg-white border border-[#E2E8F0] rounded-[8px] text-[13.5px] text-[#1A1C1E] focus:outline-none focus:border-[#0E2841] appearance-none cursor-pointer"
                >
                  {dropdownSettings.states.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C9BA8] pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
                Post Code <span className="text-[#8C9BA8]">*</span>
              </label>
              <input
                type="text"
                required
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                placeholder="3039"
                className="w-full h-[46px] px-3.5 bg-white border border-[#E2E8F0] rounded-[8px] text-[13.5px] text-[#1A1C1E] placeholder-[#BCBCBC] focus:outline-none focus:border-[#0E2841]"
              />
            </div>
          </div>

          {/* Type & Purpose * */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[13px] font-medium text-[#1A1C1E] font-['Poppins',sans-serif]">
                  Type
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
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full h-[46px] px-3.5 pr-8 bg-white border border-[#E2E8F0] rounded-[8px] text-[13.5px] text-[#1A1C1E] focus:outline-none focus:border-[#0E2841] appearance-none cursor-pointer"
                >
                  {dropdownSettings.propertyTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C9BA8] pointer-events-none" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[13px] font-medium text-[#1A1C1E] font-['Poppins',sans-serif]">
                  Purpose <span className="text-[#8C9BA8]">*</span>
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
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full h-[46px] px-3.5 pr-8 bg-white border border-[#E2E8F0] rounded-[8px] text-[13.5px] text-[#1A1C1E] focus:outline-none focus:border-[#0E2841] appearance-none cursor-pointer"
                >
                  {dropdownSettings.propertyPurposes.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C9BA8] pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Purchase Date & Purchase Price ($) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
                Purchase Date
              </label>
              <div className="relative">
                <input
                  ref={dateInputRef}
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  onClick={() => {
                    try {
                      dateInputRef.current?.showPicker();
                    } catch {}
                  }}
                  className="w-full h-[46px] px-3.5 pr-10 bg-white border border-[#E2E8F0] rounded-[8px] text-[13.5px] text-[#1A1C1E] focus:outline-none focus:border-[#0E2841] cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-10 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
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
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8C9BA8] hover:text-[#0E2841] transition-colors cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
                Purchase Price ($)
              </label>
              <input
                type="text"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="800000"
                className="w-full h-[46px] px-3.5 bg-white border border-[#E2E8F0] rounded-[8px] text-[13.5px] text-[#1A1C1E] placeholder-[#BCBCBC] focus:outline-none focus:border-[#0E2841]"
              />
            </div>
          </div>

          {/* New Fields: Purchase Costs: $ & Living area(Sqm): */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
                Purchase Costs: $
              </label>
              <input
                type="text"
                value={purchaseCosts}
                onChange={(e) => setPurchaseCosts(e.target.value)}
                placeholder="45936"
                className="w-full h-[46px] px-3.5 bg-white border border-[#E2E8F0] rounded-[8px] text-[13.5px] text-[#1A1C1E] placeholder-[#BCBCBC] focus:outline-none focus:border-[#0E2841]"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
                Living area(Sqm):
              </label>
              <input
                type="text"
                value={livingArea}
                onChange={(e) => setLivingArea(e.target.value)}
                placeholder="e.g. 220"
                className="w-full h-[46px] px-3.5 bg-white border border-[#E2E8F0] rounded-[8px] text-[13.5px] text-[#1A1C1E] placeholder-[#BCBCBC] focus:outline-none focus:border-[#0E2841]"
              />
            </div>
          </div>

          {/* Land size & Beds */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
                Land size
              </label>
              <input
                type="text"
                value={landSize}
                onChange={(e) => setLandSize(e.target.value)}
                placeholder="600"
                className="w-full h-[46px] px-3.5 bg-white border border-[#E2E8F0] rounded-[8px] text-[13.5px] text-[#1A1C1E] placeholder-[#BCBCBC] focus:outline-none focus:border-[#0E2841]"
              />
            </div>

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
          </div>

          {/* Baths & Cars */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#1A1C1E] mb-1.5 font-['Poppins',sans-serif]">
                Baths
              </label>
              <input
                type="text"
                value={baths}
                onChange={(e) => setBaths(e.target.value)}
                placeholder="2"
                className="w-full h-[46px] px-3.5 bg-white border border-[#E2E8F0] rounded-[8px] text-[13.5px] text-[#1A1C1E] placeholder-[#BCBCBC] focus:outline-none focus:border-[#0E2841]"
              />
            </div>

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
          </div>

          {/* Title Ownership Structure Sub-section */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[12.5px] font-semibold text-[#07315B] font-['Poppins',sans-serif]">
                Title Ownership Structure
              </p>
              <span
                className={`text-[12px] font-medium ${
                  isOwnershipExceeded ? "text-red-600 font-bold" : "text-[#8C9BA8]"
                }`}
              >
                Total: {totalOwnership}% / 100%
              </span>
            </div>

            <div className="border border-[#E2E8F0] rounded-[12px] p-4 bg-[#FBFBFC] space-y-4">
              {/* Row 1: Owner 1 * & Ownership % */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12.5px] font-medium text-[#1A1C1E] mb-1 font-['Poppins',sans-serif]">
                    Owner 1 <span className="text-[#8C9BA8]">*</span>
                  </label>
                  <div className="relative">
                    {availableEntities.length > 0 ? (
                      <select
                        required
                        value={owner1}
                        onChange={(e) => setOwner1(e.target.value)}
                        className="w-full h-[42px] px-3 pr-8 bg-white border border-[#E2E8F0] rounded-[8px] text-[13px] text-[#1A1C1E] focus:outline-none focus:border-[#0E2841] appearance-none cursor-pointer"
                      >
                        {availableEntities.map((ent) => (
                          <option key={ent.id} value={ent.name}>
                            {ent.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        required
                        value={owner1}
                        onChange={(e) => setOwner1(e.target.value)}
                        placeholder="e.g. Anthony Acfield"
                        className="w-full h-[42px] px-3 pr-8 bg-white border border-[#E2E8F0] rounded-[8px] text-[13px] text-[#1A1C1E] focus:outline-none focus:border-[#0E2841]"
                      />
                    )}
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
                      onChange={(e) => handleOwner1PctChange(e.target.value)}
                      placeholder="100%"
                      className="w-full h-[42px] px-3 pr-4 bg-white border border-[#E2E8F0] rounded-[8px] text-[13px] text-[#1A1C1E] focus:outline-none focus:border-[#0E2841]"
                    />
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
                    {availableEntities.length > 0 ? (
                      <select
                        value={owner2}
                        onChange={(e) => {
                          const val = e.target.value;
                          setOwner2(val);
                          if (val && !val.includes("None") && owner2Pct === "0%") {
                            const rem = Math.max(0, 100 - numOwner1);
                            setOwner2Pct(`${rem}%`);
                          } else if (!val || val.includes("None")) {
                            setOwner2Pct("0%");
                          }
                        }}
                        className="w-full h-[42px] px-3 pr-8 bg-white border border-[#E2E8F0] rounded-[8px] text-[13px] text-[#1A1C1E] focus:outline-none focus:border-[#0E2841] appearance-none cursor-pointer"
                      >
                        <option value="">None / 100% Single Owner</option>
                        {availableEntities.map((ent) => (
                          <option key={ent.id} value={ent.name}>
                            {ent.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={owner2}
                        onChange={(e) => setOwner2(e.target.value)}
                        placeholder="None / 100% Single Owner"
                        className="w-full h-[42px] px-3 pr-8 bg-white border border-[#E2E8F0] rounded-[8px] text-[13px] text-[#1A1C1E] focus:outline-none focus:border-[#0E2841]"
                      />
                    )}
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
                      onChange={(e) => handleOwner2PctChange(e.target.value)}
                      placeholder="0%"
                      className="w-full h-[42px] px-3 pr-4 bg-white border border-[#E2E8F0] rounded-[8px] text-[13px] text-[#1A1C1E] focus:outline-none focus:border-[#0E2841]"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Additional Related Persons */}
              {additionalPersons.map((person, index) => (
                <div
                  key={person.id}
                  className="grid grid-cols-2 gap-4 items-end relative pt-2 border-t border-[#F0F1F3]"
                >
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
                      {availableEntities.length > 0 ? (
                        <select
                          value={person.name}
                          onChange={(e) =>
                            handleUpdateRelatedPerson(
                              person.id,
                              "name",
                              e.target.value
                            )
                          }
                          className="w-full h-[42px] px-3 pr-8 bg-white border border-[#E2E8F0] rounded-[8px] text-[13px] text-[#1A1C1E] focus:outline-none focus:border-[#0E2841] appearance-none cursor-pointer"
                        >
                          <option value="">Select Entity...</option>
                          {availableEntities.map((ent) => (
                            <option key={ent.id} value={ent.name}>
                              {ent.name} ({ent.type || "Individual"})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={person.name}
                          onChange={(e) =>
                            handleUpdateRelatedPerson(
                              person.id,
                              "name",
                              e.target.value
                            )
                          }
                          placeholder="Owner Name"
                          className="w-full h-[42px] px-3 pr-8 bg-white border border-[#E2E8F0] rounded-[8px] text-[13px] text-[#1A1C1E] focus:outline-none focus:border-[#0E2841]"
                        />
                      )}
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C9BA8] pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12.5px] font-medium text-[#1A1C1E] mb-1 font-['Poppins',sans-serif]">
                      Ownership %
                    </label>
                    <input
                      type="text"
                      value={person.percentage}
                      onChange={(e) =>
                        handleUpdateRelatedPerson(
                          person.id,
                          "percentage",
                          e.target.value
                        )
                      }
                      placeholder="0%"
                      className="w-full h-[42px] px-3 bg-white border border-[#E2E8F0] rounded-[8px] text-[13px] text-[#1A1C1E] focus:outline-none focus:border-[#0E2841]"
                    />
                  </div>
                </div>
              ))}

              {/* Add related person button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleAddRelatedPerson}
                  className="text-[12.5px] font-medium text-[#07315B] hover:text-[#0E2841] transition-colors cursor-pointer"
                >
                  <span>+ Add Another Related Person</span>
                </button>
              </div>

              {/* Ownership % Validation Alert */}
              {isOwnershipExceeded && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-[8px] flex items-center gap-2 text-red-600 text-[12.5px]">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>
                    Total ownership percentage cannot exceed 100% (currently{" "}
                    <strong>{totalOwnership}%</strong>). Please adjust owner
                    shares.
                  </span>
                </div>
              )}
            </div>
          </div>

          {validationError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-[8px] text-red-600 text-[13px]">
              {validationError}
            </div>
          )}

          {/* Centered Add / Save Property Button */}
          <div className="pt-3 flex justify-center">
            <button
              type="submit"
              disabled={submitting || isOwnershipExceeded}
              className="w-[335px] max-w-full h-[52px] bg-[#0E2841] hover:bg-[#153B5E] disabled:opacity-50 text-white font-['Poppins',sans-serif] font-semibold text-[14px] leading-[100%] tracking-[0px] rounded-[8px] flex items-center justify-center transition-colors shadow-sm cursor-pointer"
            >
              {submitting
                ? initialData
                  ? "Saving Changes..."
                  : "Saving Property..."
                : initialData
                ? "Save Changes"
                : "Add Property"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
