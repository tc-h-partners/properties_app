"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function ReviewStatus() {
  const statusItems = [
    {
      title: "Total Households",
      value: "8",
      subtitle: "Total managed client accounts",
      icon: "/images/dashboard/house-chimney.svg",
      lineWidth: "w-[234px]",
      href: "/household",
    },
    {
      title: "Completed",
      value: "6",
      subtitle: "Reviews signed off & delivered",
      icon: "/images/dashboard/thumbs-up.svg",
      lineWidth: "w-[234px]",
      href: "/household",
    },
    {
      title: "In Progress",
      value: "6",
      subtitle: "Under active adviser review",
      icon: "/images/dashboard/sync.svg",
      lineWidth: "w-[177px]",
      href: "/review",
    },
    {
      title: "Not Started",
      value: "6",
      subtitle: "Awaiting data intake & onboarding",
      icon: "/images/dashboard/discover.svg",
      lineWidth: "w-[177px]",
      href: "/household",
    },
  ];

  return (
    <div className="bg-white rounded-[12px] p-6 shadow-[0px_11px_9px_rgba(0,0,0,0.04)] select-none">
      {/* Title */}
      <h2 className="font-['Poppins',sans-serif] font-semibold text-[#0E2841] text-[20px] tracking-[-0.64px]">
        Review Status
      </h2>

      {/* Top Divider */}
      <div className="h-[1px] w-full bg-[#E2E8F0] my-4" />

      {/* 4 Status Cards */}
      <div className="space-y-3.5">
        {statusItems.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="bg-[#F6F9FB] rounded-[12px] h-[86px] px-5 flex items-center transition-all hover:border hover:border-[#CBD5E1] block cursor-pointer"
          >
            <div className="flex items-center gap-[18px]">
              <div className="bg-white border border-[#DCE4E8] shadow-[0px_4px_2px_rgba(0,0,0,0.05)] rounded-full size-[50px] flex items-center justify-center p-[5px] shrink-0">
                <Image
                  src={item.icon}
                  alt=""
                  width={24}
                  height={24}
                  className="size-[24px] object-contain"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-['Poppins',sans-serif] font-medium text-[#8B8585] text-[15px] sm:text-[16px] leading-tight">
                    {item.title}
                  </p>
                  <p className="font-['Poppins',sans-serif] font-extrabold text-[#8B8585] text-[14px]">
                    {item.value}
                  </p>
                </div>
                <div className={`h-[1px] ${item.lineWidth} max-w-full bg-[#CBD5E1] my-1.5`} />
                <p className="font-['Poppins',sans-serif] font-normal text-[#8B8585] text-[13px] sm:text-[14px] leading-none truncate">
                  {item.subtitle}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
