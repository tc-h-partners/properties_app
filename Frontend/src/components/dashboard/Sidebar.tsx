"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Box, Settings, ChevronDown } from "lucide-react";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  activeSubItemLabel?: string;
}

export default function Sidebar({
  isOpen = true,
  onClose,
  activeSubItemLabel,
}: SidebarProps) {
  const pathname = usePathname();
  const isHouseholdActive =
    pathname.startsWith("/household") || pathname.startsWith("/review");
  const isDashboardActive = pathname === "/dashboard";
  const isSettingsActive = pathname.startsWith("/settings");

  const [householdOpen, setHouseholdOpen] = useState(true);
  const subLabel =
    activeSubItemLabel ||
    (pathname.startsWith("/review")
      ? "Harrison Family -\nReview Workspace"
      : "Harrison Family");

  return (
    <aside
      className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-[230px] bg-[#0E2841] text-white flex flex-col justify-between py-[27px] px-[22px] transition-transform duration-200 select-none shrink-0 overflow-y-auto ${
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}
    >
      {/* Top Section: Logo & Navigation */}
      <div className="flex flex-col gap-[33px]">
        {/* Top Logo */}
        <div className="flex items-center justify-start pl-1">
          <Link href="/dashboard" className="block">
            <Image
              src="/images/logo-cfo.png"
              alt="Property Investor CFO"
              width={160}
              height={37}
              priority
              className="object-contain"
            />
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-3">
          {/* Dashboard Item */}
          <Link
            href="/dashboard"
            onClick={onClose}
            className={`flex items-center gap-[16px] px-[12px] py-[10px] rounded-[5px] w-full transition-colors ${
              isDashboardActive
                ? "bg-[#183654] text-white"
                : "text-white/80 hover:text-white hover:bg-white/5"
            }`}
          >
            <Home className="w-5 h-5 text-white shrink-0 stroke-[1.8]" />
            <span className="font-['Inter',sans-serif] font-medium text-[16px] leading-[1.4] text-white">
              Dashboard
            </span>
          </Link>

          {/* Household Dropdown Item (from Household Setup in Figma) */}
          <div className="flex flex-col">
            <div
              onClick={() => setHouseholdOpen(!householdOpen)}
              className={`flex items-center justify-between px-[12px] py-[10px] rounded-[5px] w-full cursor-pointer transition-colors ${
                isHouseholdActive
                  ? "bg-[rgba(255,255,255,0.1)] text-white"
                  : "text-white/80 hover:text-white hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-[16px]">
                <Box className="w-5 h-5 text-white shrink-0 stroke-[1.8]" />
                <span className="font-['Inter',sans-serif] font-medium text-[16px] leading-[1.4] text-white">
                  Household
                </span>
              </div>
              <ChevronDown
                className={`w-[17px] h-[17px] text-white transition-transform duration-200 ${
                  householdOpen ? "rotate-0" : "-rotate-90"
                }`}
              />
            </div>

            {/* Nested Sub-item: Harrison Family / TC&H Review Workspace */}
            {householdOpen && (
              <div className="mt-2.5 pl-3">
                <Link
                  href="/household/harrison-family"
                  onClick={onClose}
                  className="bg-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.28)] flex items-center gap-[9px] min-h-[42px] px-[16px] py-[10px] rounded-[8px] w-full transition-colors"
                >
                  <div className="size-[20px] relative shrink-0">
                    <Image
                      src="/images/dashboard/users-group.svg"
                      alt=""
                      width={20}
                      height={20}
                      className="size-full object-contain brightness-0 invert"
                    />
                  </div>
                  <span className="font-['Inter',sans-serif] font-medium text-[12px] leading-[1.4] text-white whitespace-pre-line">
                    {subLabel}
                  </span>
                </Link>
              </div>
            )}
          </div>

          {/* System Settings Item */}
          <Link
            href="/settings"
            onClick={onClose}
            className={`flex items-center gap-[16px] px-[12px] py-[10px] rounded-[5px] w-full transition-colors ${
              isSettingsActive
                ? "bg-[#183654] text-white"
                : "text-white/80 hover:text-white hover:bg-white/5"
            }`}
          >
            <Settings className="w-5 h-5 text-white shrink-0 stroke-[1.8]" />
            <span className="font-['Inter',sans-serif] font-medium text-[16px] leading-[1.4] text-white">
              System Settings
            </span>
          </Link>
        </nav>
      </div>

      {/* Bottom Section: tc&h Partners Logo */}
      <div className="pt-6 flex flex-col items-start px-2">
        <Image
          src="/images/logo-tch-partners.png"
          alt="tc&h Partners"
          width={125}
          height={55}
          priority
          className="object-contain"
        />
      </div>
    </aside>
  );
}
