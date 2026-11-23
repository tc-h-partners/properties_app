"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

interface HouseholdCardProps {
  totalHouseholds?: number;
}

export default function HouseholdCard({ totalHouseholds }: HouseholdCardProps) {
  return (
    <Link
      href="/household"
      className="bg-[#F6F9FB] border border-[rgba(0,0,0,0.05)] h-[100px] overflow-clip relative rounded-[12px] flex items-center px-[25px] transition-all hover:border-[rgba(0,0,0,0.12)] cursor-pointer block group"
    >
      {/* Left Content */}
      <div className="flex gap-[14px] items-center z-10">
        {/* Circle Icon Badge */}
        <div className="bg-white border border-[#DCE4E8] shadow-[0px_4px_2px_rgba(0,0,0,0.05)] flex items-center justify-center p-[5px] rounded-full size-[50px] shrink-0">
          <div className="size-[24px] relative shrink-0">
            <Image
              src="/images/dashboard/house-chimney.svg"
              alt=""
              width={24}
              height={24}
              className="size-full object-contain"
            />
          </div>
        </div>

        {/* Text Details */}
        <div className="flex flex-col h-[50px] items-start justify-between">
          <p className="capitalize font-['Poppins',sans-serif] font-semibold text-[#1E1E1E] text-[20px] sm:text-[22px] leading-tight">
            Household
          </p>
          <p className="font-['Familjen_Grotesk',sans-serif] font-bold text-[#0E2841] text-[22px] leading-none">
            {totalHouseholds !== undefined ? totalHouseholds : 0}
          </p>
        </div>
      </div>

      {/* Right: Watermark Icon */}
      <div className="absolute right-[20px] top-[12px] opacity-20 pointer-events-none select-none">
        <Image
          src="/images/dashboard/family-watermark.svg"
          alt=""
          width={83}
          height={83}
          className="object-contain"
        />
      </div>
    </Link>
  );
}
