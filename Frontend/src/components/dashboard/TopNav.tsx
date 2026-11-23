"use client";

import React from "react";
import Image from "next/image";

interface TopNavProps {
  onToggleSidebar?: () => void;
}

export default function TopNav({ onToggleSidebar }: TopNavProps) {
  return (
    <header className="h-[70px] w-full bg-white border-b border-[rgba(107,107,107,0.3)] flex items-center justify-between px-6 select-none sticky top-0 z-20 shrink-0 shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
      {/* Left: Back / Toggle Button */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="w-[44px] h-[45px] bg-white rounded-[3.3px] shadow-[0px_1.78px_8.9px_rgba(69,69,80,0.1)] flex items-center justify-center text-[#0E2841] hover:bg-gray-50 transition-colors cursor-pointer"
          aria-label="Toggle navigation"
        >
          <Image
            src="/images/dashboard/chevron-left.svg"
            alt=""
            width={18}
            height={18}
            className="-rotate-90"
          />
        </button>
      </div>

      {/* Right: Notifications & User Profile */}
      <div className="flex items-center gap-5">
        {/* Bell Icon with Red Dot */}
        <button
          type="button"
          className="w-[45px] h-[46px] bg-white rounded-[3.3px] shadow-[0px_1.78px_17.8px_rgba(69,69,80,0.1)] flex items-center justify-center relative hover:bg-gray-50 transition-colors cursor-pointer"
          aria-label="Notifications"
        >
          <div className="relative">
            <Image
              src="/images/dashboard/bell.svg"
              alt="Notifications"
              width={20}
              height={20}
            />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#EA4335] rounded-full ring-2 ring-white" />
          </div>
        </button>

        {/* Divider */}
        <div className="h-[30px] w-[1px] bg-[rgba(107,107,107,0.3)]" />

        {/* User Profile */}
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="relative w-[40px] h-[40px] rounded-full overflow-hidden">
            <Image
              src="/images/dashboard/avatar-hermie.png"
              alt="Hermie"
              fill
              className="object-cover"
              sizes="40px"
              priority
            />
          </div>
          <span className="text-[14px] font-normal text-[#0E2841] font-['Inter',sans-serif]">
            Hermie
          </span>
        </div>
      </div>
    </header>
  );
}
