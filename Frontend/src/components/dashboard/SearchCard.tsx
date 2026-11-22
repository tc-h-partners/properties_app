"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function SearchCard() {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/household?search=${encodeURIComponent(query.trim())}`);
    } else {
      router.push("/household");
    }
  };

  return (
    <form
      onSubmit={handleSearch}
      className="bg-[#F6F9FB] border border-[rgba(0,0,0,0.05)] h-[100px] overflow-clip relative rounded-[12px] flex items-center px-[25px] transition-all hover:border-[rgba(0,0,0,0.12)] cursor-text"
    >
      {/* Left Content */}
      <div className="flex gap-[14px] items-center z-10 w-full pr-24">
        {/* Circle Icon Badge */}
        <div className="bg-white border border-[#DCE4E8] shadow-[0px_4px_2px_rgba(0,0,0,0.05)] flex items-center justify-center p-[5px] rounded-full size-[50px] shrink-0">
          <div className="size-[24px] relative shrink-0">
            <Image
              src="/images/dashboard/discover.svg"
              alt=""
              width={24}
              height={24}
              className="size-full object-contain"
            />
          </div>
        </div>

        {/* Input matching Figma "Search...." underline */}
        <div className="flex flex-col h-[50px] items-start justify-center flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Search...."
            className="w-full bg-transparent font-['Poppins',sans-serif] font-semibold text-[#1E1E1E] text-[20px] sm:text-[22px] placeholder-[#1E1E1E] underline decoration-[#1E1E1E]/40 underline-offset-4 focus:outline-none focus:no-underline"
          />
        </div>
      </div>

      {/* Right: Watermark Icon */}
      <div className="absolute right-[20px] top-[12px] opacity-20 pointer-events-none select-none">
        <Image
          src="/images/dashboard/search-watermark.svg"
          alt=""
          width={83}
          height={83}
          className="object-contain"
        />
      </div>
    </form>
  );
}
