"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, ChevronDown } from "lucide-react";
import { getStoredUser, logoutApi } from "@/lib/api";

interface TopNavProps {
  onToggleSidebar?: () => void;
  onBack?: () => void;
}

function getEmailFromStorage(): string {
  const u = getStoredUser();
  if (u?.email) return u.email;

  if (typeof window !== "undefined") {
    try {
      const token = localStorage.getItem("cfo_access_token");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload?.email) return payload.email;
      }
    } catch {
      // ignore malformed token
    }
  }
  return "";
}

function extractUserNameFromEmail(email: string): string {
  if (!email) return "User";
  const localPart = email.split("@")[0] || email;
  return localPart;
}

export default function TopNav({ onBack }: TopNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState("testuser");
  const [userEmail, setUserEmail] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncUser = () => {
      const email = getEmailFromStorage();
      if (email) {
        setUserEmail(email);
        setUserName(extractUserNameFromEmail(email));
      } else {
        const u = getStoredUser();
        if (u?.fullName) {
          setUserName(u.fullName);
        }
      }
    };

    syncUser();
    window.addEventListener("cfo-user-changed", syncUser);
    window.addEventListener("storage", syncUser);
    return () => {
      window.removeEventListener("cfo-user-changed", syncUser);
      window.removeEventListener("storage", syncUser);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else if (pathname.startsWith("/household/")) {
      router.push("/household");
    } else if (pathname !== "/dashboard") {
      router.push("/dashboard");
    }
  };

  const handleLogout = () => {
    setDropdownOpen(false);
    logoutApi();
    router.push("/");
  };

  return (
    <header className="h-[70px] w-full bg-white border-b border-[rgba(107,107,107,0.3)] flex items-center justify-between px-6 select-none sticky top-0 z-20 shrink-0 shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
      {/* Left: Back Button */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={handleBack}
          className="w-[44px] h-[45px] bg-white rounded-[3.3px] shadow-[0px_1.78px_8.9px_rgba(69,69,80,0.1)] flex items-center justify-center text-[#0E2841] hover:bg-gray-50 transition-colors cursor-pointer"
          aria-label="Go back"
          title="Go back"
        >
          <Image
            src="/images/dashboard/chevron-left.svg"
            alt="Back"
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

        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
            className="flex items-center gap-3 cursor-pointer rounded-lg py-1 px-1.5 hover:bg-gray-50 transition-colors focus:outline-none"
          >
            <div className="relative w-[40px] h-[40px] rounded-full overflow-hidden shrink-0">
              <Image
                src="/images/dashboard/avatar-hermie.png"
                alt={userName}
                fill
                className="object-cover"
                sizes="40px"
                priority
              />
            </div>
            <span className="text-[14px] font-normal text-[#0E2841] font-['Inter',sans-serif]">
              {userName}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-[#64748B] transition-transform duration-150 ${
                dropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-[10px] shadow-[0px_10px_25px_-5px_rgba(0,0,0,0.1),0px_4px_10px_-3px_rgba(0,0,0,0.05)] border border-[#E2E8F0] py-1.5 z-50">
              {userEmail && (
                <div className="px-3.5 py-2 border-b border-[#F1F5F9]">
                  <p className="text-[12px] font-medium text-[#0E2841] truncate font-['Inter',sans-serif]">
                    {userName}
                  </p>
                  <p className="text-[11px] text-[#64748B] truncate font-['Inter',sans-serif]">
                    {userEmail}
                  </p>
                </div>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[13.5px] font-medium text-[#DC2626] hover:bg-red-50 transition-colors cursor-pointer font-['Inter',sans-serif]"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
